"use client";

import { MainLayout } from "@/components/MainLayout";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from "recharts";
import {
  PackageSearch, Clock, CheckCircle2, AlertCircle,
  RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Activity
} from "lucide-react";
import Cookies from "js-cookie";

const STATUS_CONFIG = {
  Completed:  { color: "#10b981", glow: "rgba(16,185,129,0.25)",  gradient: "linear-gradient(135deg,#10b981,#059669)", label: "Completed" },
  OnDelivery: { color: "#3b82f6", glow: "rgba(59,130,246,0.25)", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)", label: "On Delivery" },
  OnOrder:    { color: "#f59e0b", glow: "rgba(245,158,11,0.25)",  gradient: "linear-gradient(135deg,#f59e0b,#d97706)", label: "On Order" },
  Partial:    { color: "#8b5cf6", glow: "rgba(139,92,246,0.25)",  gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)", label: "Partial" },
  Overdue:    { color: "#ef4444", glow: "rgba(239,68,68,0.25)",   gradient: "linear-gradient(135deg,#ef4444,#dc2626)", label: "Overdue" },
};

const CARD_CONFIG = [
  { key: "total_order",  label: "Total Order",  icon: PackageSearch, color: "#EB0A1E", glow: "rgba(235,10,30,0.25)",   gradient: "linear-gradient(135deg,#EB0A1E,#c90011)" },
  { key: "on_order",     label: "On Order",     icon: Clock,         color: "#f59e0b", glow: "rgba(245,158,11,0.25)", gradient: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { key: "on_delivery",  label: "On Delivery",  icon: RefreshCw,     color: "#3b82f6", glow: "rgba(59,130,246,0.25)", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)" },
  { key: "completed",    label: "Completed",    icon: CheckCircle2,  color: "#10b981", glow: "rgba(16,185,129,0.25)", gradient: "linear-gradient(135deg,#10b981,#059669)" },
  { key: "partial",      label: "Partial",      icon: AlertCircle,   color: "#8b5cf6", glow: "rgba(139,92,246,0.25)", gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
  { key: "overdue",      label: "Overdue",      icon: AlertTriangle, color: "#ef4444", glow: "rgba(239,68,68,0.25)",  gradient: "linear-gradient(135deg,#ef4444,#dc2626)" },
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="tooltip-modern px-4 py-3" style={{
        background: "rgba(13,17,23,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        backdropFilter: "blur(12px)",
        minWidth: 120,
      }}>
        <p className="text-white/50 text-[10px] font-semibold tracking-widest uppercase mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-white font-bold text-sm" style={{ color: p.color }}>
            {p.name}: <span className="text-white">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [summary, setSummary]   = useState<any>(null);
  const [charts, setCharts]     = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser]         = useState<{ name: string; role: string } | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.fetch("/dashboard/summary"),
        api.fetch("/dashboard/charts"),
      ]);
      setSummary(sumRes);
      setCharts(chartRes);
    } catch {
      console.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Animate numbers up
  useEffect(() => {
    if (summary) {
      const targets: Record<string, number> = {
        total_order: summary.total_order || 0,
        on_order:    summary.on_order    || 0,
        on_delivery: summary.on_delivery || 0,
        completed:   summary.completed   || 0,
        partial:     summary.partial     || 0,
        overdue:     summary.overdue     || 0,
      };

      const duration = 1000;
      const steps    = 40;
      const interval = duration / steps;
      let step       = 0;

      const timer = setInterval(() => {
        step++;
        const progress = Math.min(step / steps, 1);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        const interpolated: Record<string, number> = {};
        Object.entries(targets).forEach(([k, v]) => {
          interpolated[k] = Math.round(v * eased);
        });
        setAnimatedValues(interpolated);

        if (step >= steps) clearInterval(timer);
      }, interval);

      return () => clearInterval(timer);
    }
  }, [summary]);

  useEffect(() => {
    fetchData();
    const raw = Cookies.get("user");
    if (raw) { try { setUser(JSON.parse(raw)); } catch {} }
  }, [fetchData]);

  // Pie chart data key normalization
  const getPieColor = (name: string) => {
    const key = name.replace(/\s/g, "") as keyof typeof STATUS_CONFIG;
    return STATUS_CONFIG[key]?.color || "#EB0A1E";
  };

  const completionRate = summary
    ? Math.round(((summary.completed || 0) / Math.max(summary.total_order || 1, 1)) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="page-transition space-y-7">

        {/* Welcome Banner */}
        <div
          className="relative rounded-2xl overflow-hidden p-7"
          style={{
            background: "linear-gradient(135deg, rgba(235,10,30,0.12) 0%, rgba(201,0,17,0.06) 60%, transparent 100%)",
            border: "1px solid rgba(235,10,30,0.15)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Glow accent */}
          <div
            className="pointer-events-none absolute top-0 right-0 w-64 h-64 opacity-10 blur-3xl"
            style={{ background: "radial-gradient(circle, #EB0A1E 0%, transparent 70%)" }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="status-dot bg-emerald-400" style={{ width: 8, height: 8 }} />
                <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Live Dashboard</span>
              </div>
              <h1 className="font-black text-2xl md:text-3xl font-display" style={{ color: "var(--foreground)" }}>
                Welcome back,{" "}
                <span className="gradient-text">{user?.name || "Admin"}</span>
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  Manage your parts and inventory efficiently with SpareLux Wira Toyota system.
              </p>
            </div>

            {/* Completion Badge */}
            <div className="shrink-0 hidden sm:flex flex-col items-center justify-center w-20 h-20 rounded-2xl" style={{
              background: "rgba(235,10,30,0.1)",
              border: "1px solid rgba(235,10,30,0.2)",
              backdropFilter: "blur(8px)",
            }}>
              <span className="text-2xl font-black gradient-text font-display">{completionRate}%</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Done</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="progress-modern">
              <div className="progress-fill" style={{ width: `${completionRate}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Completion Rate</span>
              <span className="text-[10px] font-semibold" style={{ color: "#EB0A1E" }}>{completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {CARD_CONFIG.map((cfg, i) => {
            const Icon = cfg.icon;
            const val  = animatedValues[cfg.key] ?? 0;
            const total = animatedValues["total_order"] || 1;
            const pct   = cfg.key !== "total_order" ? Math.round((val / total) * 100) : 100;

            return (
              <div
                key={cfg.key}
                className="stat-card card p-5 cursor-default"
                style={{
                  animationDelay: `${i * 80}ms`,
                  animation: "fade-in 0.5s cubic-bezier(0.4,0,0.2,1) both",
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: cfg.gradient, boxShadow: `0 4px 16px ${cfg.glow}` }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Value */}
                <div className="font-black text-3xl font-display" style={{ color: "var(--foreground)" }}>
                  {isLoading ? (
                    <div className="skeleton h-8 w-12 rounded-lg" />
                  ) : val}
                </div>

                {/* Label */}
                <p className="text-xs font-medium mt-1 mb-3" style={{ color: "var(--text-muted)" }}>{cfg.label}</p>

                {/* Mini progress */}
                {!isLoading && (
                  <div className="progress-modern" style={{ height: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${pct}%`,
                      background: cfg.gradient,
                      boxShadow: `0 0 8px ${cfg.glow}`,
                      transition: "width 1.4s cubic-bezier(0.4,0,0.2,1)"
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Pie / Donut Chart */}
          <div className="card p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#EB0A1E,#c90011)" }} />
              <h2 className="font-bold text-base font-display" style={{ color: "var(--foreground)" }}>Status Overview</h2>
            </div>

            <div className="h-52 relative flex items-center justify-center">
              {isLoading ? (
                <div className="skeleton w-44 h-44 rounded-full" />
              ) : charts?.pieData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {charts.pieData.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={getPieColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data</p>
              )}
            </div>

            {/* Legend */}
            {!isLoading && charts?.pieData && (
              <div className="mt-4 space-y-2">
                {charts.pieData.map((entry: any) => {
                  const col = getPieColor(entry.name);
                  return (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{entry.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: col }}>{entry.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Area / Line Chart */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#EB0A1E,#c90011)" }} />
                <h2 className="font-bold text-base font-display" style={{ color: "var(--foreground)" }}>Order Volume per Month</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: "#EB0A1E" }} />
                <span className="text-xs font-semibold" style={{ color: "#EB0A1E" }}>Live</span>
              </div>
            </div>

            <div className="h-64">
              {isLoading ? (
                <div className="skeleton w-full h-full rounded-xl" />
              ) : charts?.lineData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.lineData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#EB0A1E" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#EB0A1E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} vertical={false} stroke="#fff" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Inter" }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "Inter" }}
                      dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="order_count"
                      name="Orders"
                      stroke="#EB0A1E"
                      strokeWidth={2.5}
                      fill="url(#redGradient)"
                      dot={{ fill: "#EB0A1E", strokeWidth: 0, r: 3.5 }}
                      activeDot={{ r: 6, fill: "#EB0A1E", strokeWidth: 2, stroke: "rgba(235,10,30,0.3)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Summary Row */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#EB0A1E,#c90011)" }} />
            <h2 className="font-bold text-base font-display" style={{ color: "var(--foreground)" }}>Order Status Breakdown</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const mappedKey = key === "OnDelivery" ? "on_delivery" : key === "OnOrder" ? "on_order" : key.toLowerCase();
              const val = summary?.[mappedKey] || 0;
              const total = summary?.total_order || 1;
              const pct = Math.round((val / total) * 100);

              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{cfg.label}</span>
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{val}</span>
                  </div>
                  <div className="progress-modern">
                    <div
                      className="progress-fill"
                      style={{
                        width: isLoading ? "0%" : `${pct}%`,
                        background: cfg.gradient,
                        boxShadow: `0 0 8px ${cfg.glow}`,
                        transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)"
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{pct}% of total</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
