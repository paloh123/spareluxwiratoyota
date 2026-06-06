"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/MainLayout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import {
  Warehouse, Search, Filter, CheckCircle2, PackageCheck,
  Info, X, AlertTriangle, Clock, Package, Users, Eye,
  ChevronLeft, ChevronRight, RefreshCw, Calendar,
  ShieldCheck, AlertCircle
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────
interface ReadyItem {
  id: number;
  no_order: string;
  nama_pelanggan: string;
  no_polisi: string;
  sa: string;
  foreman: string;
  nama_part: string;
  qty: number;
  tgl_order: string;
  tanggal_part_datang: string | null;
  status_order: string;
  status_gudang: "BELUM_DIAMBIL" | "DIAMBIL";
  status_pemasangan: "BELUM_DIPASANG" | "SELESAI";
  umur_pending: number | null;
  is_overdue: boolean;
}

interface Stats {
  total_ready: number;
  belum_dipasang: number;
  belum_diambil: number;
  overdue: number;
}

// ─────────────────────────────────────────────────────────────────
//  BADGE COMPONENTS
// ─────────────────────────────────────────────────────────────────
function StatusGudangBadge({ status }: { status: string }) {
  if (status === "DIAMBIL") {
    return (
      <span className="ri-badge ri-badge-green">
        <PackageCheck className="w-3 h-3" /> DIAMBIL
      </span>
    );
  }
  return (
    <span className="ri-badge ri-badge-orange">
      <AlertCircle className="w-3 h-3" /> BELUM DIAMBIL
    </span>
  );
}

function StatusPasangBadge({ status, overdue }: { status: string; overdue: boolean }) {
  if (status === "SELESAI") {
    return (
      <span className="ri-badge ri-badge-green">
        <CheckCircle2 className="w-3 h-3" /> SELESAI
      </span>
    );
  }
  if (overdue) {
    return (
      <span className="ri-badge ri-badge-overdue">
        <AlertTriangle className="w-3 h-3" /> BELUM DIPASANG
      </span>
    );
  }
  return (
    <span className="ri-badge ri-badge-red">
      <X className="w-3 h-3" /> BELUM DIPASANG
    </span>
  );
}

function UmurBadge({ umur }: { umur: number | null }) {
  if (umur === null || umur === undefined) return <span className="text-white/30 text-xs">–</span>;
  if (umur > 3) {
    return (
      <span className="ri-badge ri-badge-overdue">
        <Clock className="w-3 h-3" /> {umur} Hari ⚠️
      </span>
    );
  }
  if (umur >= 1) {
    return (
      <span className="ri-badge ri-badge-orange">
        <Clock className="w-3 h-3" /> {umur} Hari
      </span>
    );
  }
  return (
    <span className="ri-badge ri-badge-green">
      <Clock className="w-3 h-3" /> Hari ini
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
//  DETAIL MODAL
// ─────────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: ReadyItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fields = [
    { label: "No Order", value: item.no_order },
    { label: "Nama Customer", value: item.nama_pelanggan },
    { label: "No Polisi", value: item.no_polisi },
    { label: "SA", value: item.sa || "–" },
    { label: "Foreman", value: item.foreman || "–" },
    { label: "Nama Part", value: item.nama_part },
    { label: "Qty", value: `${item.qty} PCS` },
    { label: "Tanggal Order", value: formatDate(item.tgl_order) },
    { label: "Tanggal Part Datang", value: item.tanggal_part_datang ? formatDate(item.tanggal_part_datang) : "–" },
    { label: "Status Order", value: item.status_order },
    { label: "Status Gudang", value: item.status_gudang },
    { label: "Status Pemasangan", value: item.status_pemasangan },
    { label: "Umur Pending", value: item.umur_pending !== null ? `${item.umur_pending} Hari` : "–" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ri-modal">
        {/* Header */}
        <div className="ri-modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Detail Order</h2>
              <p className="text-xs text-white/40 font-mono mt-0.5">{item.no_order}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Overdue warning */}
        {item.is_overdue && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <p className="text-xs text-red-400 font-medium">
              Part ini sudah pending selama <strong>{item.umur_pending} hari</strong> — mohon segera ditangani!
            </p>
          </div>
        )}

        {/* Fields */}
        <div className="p-5 grid grid-cols-2 gap-3">
          {fields.map(({ label, value }) => (
            <div key={label}
              className="px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-1">{label}</p>
              <p className="text-sm font-medium text-white/85">{value}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon: Icon, color, glow, delay
}: {
  title: string; value: number | string; icon: any; color: string; glow: string; delay: string;
}) {
  return (
    <div className={`ri-stat-card slide-in ${delay}`}
      style={{ "--ri-glow": glow } as any}>
      <div className="ri-stat-card-glow" style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">{title}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${color})`, boxShadow: `0 4px 20px ${glow}` }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function ReadyInstallationPage() {
  const [items, setItems] = useState<ReadyItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total_ready: 0, belum_dipasang: 0, belum_diambil: 0, overdue: 0 });
  const [saList, setSaList] = useState<string[]>([]);
  const [foremanList, setForemanList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailItem, setDetailItem] = useState<ReadyItem | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSA, setFilterSA] = useState("");
  const [filterForeman, setFilterForeman] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT = 20;

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch data ──
  const fetchData = useCallback(async (p = page, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(filterStatus !== "All" && { status: filterStatus }),
        ...(filterSA && { sa: filterSA }),
        ...(filterForeman && { foreman: filterForeman }),
        ...(filterFrom && { from: filterFrom }),
        ...(filterTo && { to: filterTo }),
      });

      const [dataRes, statsRes] = await Promise.all([
        api.fetch(`/ready-installation?${params}`),
        api.fetch(`/ready-installation/stats`),
      ]);

      setItems(dataRes.data);
      setTotalPages(dataRes.pagination.totalPages);
      setTotalRecords(dataRes.pagination.total);
      setStats(statsRes);
    } catch (err: any) {
      toast.error("Gagal memuat data: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, filterStatus, filterSA, filterForeman, filterFrom, filterTo]);

  // ── Fetch filter options once ──
  useEffect(() => {
    api.fetch("/ready-installation/filters").then((res) => {
      setSaList(res.sa_list || []);
      setForemanList(res.foreman_list || []);
    }).catch(() => {});
  }, []);

  // ── Debounced search ──
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, filterStatus, filterSA, filterForeman, filterFrom, filterTo]);

  useEffect(() => { fetchData(page); }, [page]);

  // ── Actions ──
  const handleDipasang = async (item: ReadyItem) => {
    if (!confirm(`Tandai "${item.nama_part}" sudah dipasang?`)) return;
    setActionLoading(item.id);
    try {
      await api.fetch(`/ready-installation/${item.id}/dipasang`, { method: "PATCH" });
      toast.success("✅ Status pemasangan diperbarui ke SELESAI");
      fetchData(page, true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiambil = async (item: ReadyItem) => {
    if (!confirm(`Tandai "${item.nama_part}" sudah diambil dari gudang?`)) return;
    setActionLoading(item.id);
    try {
      await api.fetch(`/ready-installation/${item.id}/diambil`, { method: "PATCH" });
      toast.success("✅ Status gudang diperbarui ke DIAMBIL");
      fetchData(page, true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => { fetchData(page, true); };

  // ─────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      {/* Global CSS for this page */}
      <style>{`
        .ri-stat-card {
          position: relative;
          overflow: hidden;
          padding: 1.25rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(24px);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ri-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .ri-stat-card-glow {
          position: absolute;
          top: -30%;
          right: -10%;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          opacity: 0.12;
          transition: transform 0.4s ease;
          pointer-events: none;
        }
        .ri-stat-card:hover .ri-stat-card-glow {
          transform: scale(1.8);
          opacity: 0.18;
        }

        /* BADGES */
        .ri-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .ri-badge-green {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.3);
          color: #34d399;
        }
        .ri-badge-orange {
          background: rgba(249,115,22,0.12);
          border: 1px solid rgba(249,115,22,0.3);
          color: #fb923c;
        }
        .ri-badge-red {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
        }
        .ri-badge-overdue {
          background: rgba(239,68,68,0.18);
          border: 1px solid rgba(239,68,68,0.6);
          color: #ef4444;
          animation: overdue-glow 1.5s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(239,68,68,0.4);
        }
        @keyframes overdue-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 20px rgba(239,68,68,0.7), 0 0 30px rgba(239,68,68,0.2); }
        }

        /* TABLE */
        .ri-table-wrapper {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(20px);
        }
        .ri-table { width: 100%; border-collapse: collapse; }
        .ri-th {
          padding: 14px 16px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          white-space: nowrap;
        }
        .ri-td {
          padding: 13px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          vertical-align: middle;
        }
        .ri-tr {
          transition: background 0.15s ease;
        }
        .ri-tr:hover { background: rgba(255,255,255,0.04); }
        .ri-tr-overdue { background: rgba(239,68,68,0.04) !important; }
        .ri-tr-overdue:hover { background: rgba(239,68,68,0.08) !important; }
        .ri-tr-overdue .ri-td-no { border-left: 3px solid rgba(239,68,68,0.6); }

        /* ACTION BUTTONS */
        .ri-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .ri-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ri-btn-green {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.3);
          color: #34d399;
        }
        .ri-btn-green:not(:disabled):hover {
          background: rgba(16,185,129,0.25);
          box-shadow: 0 0 12px rgba(16,185,129,0.3);
        }
        .ri-btn-orange {
          background: rgba(249,115,22,0.12);
          border-color: rgba(249,115,22,0.3);
          color: #fb923c;
        }
        .ri-btn-orange:not(:disabled):hover {
          background: rgba(249,115,22,0.25);
          box-shadow: 0 0 12px rgba(249,115,22,0.3);
        }
        .ri-btn-ghost {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
        }
        .ri-btn-ghost:not(:disabled):hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
        }

        /* FILTER BAR */
        .ri-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 8px 14px;
          color: rgba(255,255,255,0.85);
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ri-input::placeholder { color: rgba(255,255,255,0.25); }
        .ri-input:focus {
          border-color: rgba(6,182,212,0.5);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
        }
        .ri-input option { background: #0d1117; color: #e8eaf0; }

        /* MODAL */
        .ri-modal {
          background: rgba(13,17,27,0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          backdrop-filter: blur(40px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.8);
          animation: modal-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ri-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.25rem 0;
        }

        /* PAGINATION */
        .ri-page-btn {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.03);
        }
        .ri-page-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
        }
        .ri-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .ri-page-btn.active {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 15px rgba(6,182,212,0.4);
        }

        /* EMPTY STATE */
        .ri-empty {
          text-align: center;
          padding: 64px 24px;
        }
      `}</style>

      {/* Detail Modal */}
      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}

      {/* ── PAGE HEADER ── */}
      <div className="mb-8 slide-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                boxShadow: "0 8px 30px rgba(6,182,212,0.4)"
              }}>
              <Warehouse className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Part Ready Belum Dipasang
              </h1>
              <p className="text-sm text-white/40 mt-1 max-w-lg">
                Monitoring part yang sudah tersedia namun belum dipasang atau belum diambil dari gudang.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(6,182,212,0.1)",
              border: "1px solid rgba(6,182,212,0.3)",
              color: "#06b6d4"
            }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Ready"
          value={stats.total_ready}
          icon={Package}
          color="#06b6d4, #0891b2"
          glow="rgba(6,182,212,0.6)"
          delay="slide-in-delay-1"
        />
        <StatCard
          title="Belum Dipasang"
          value={stats.belum_dipasang}
          icon={AlertCircle}
          color="#ef4444, #dc2626"
          glow="rgba(239,68,68,0.6)"
          delay="slide-in-delay-2"
        />
        <StatCard
          title="Belum Diambil Gudang"
          value={stats.belum_diambil}
          icon={Warehouse}
          color="#f97316, #ea580c"
          glow="rgba(249,115,22,0.6)"
          delay="slide-in-delay-3"
        />
        <StatCard
          title="Overdue > 3 Hari"
          value={stats.overdue}
          icon={AlertTriangle}
          color="#ef4444, #7f1d1d"
          glow="rgba(239,68,68,0.8)"
          delay="slide-in-delay-4"
        />
      </div>

      {/* ── FILTER BAR ── */}
      <div className="mb-5 p-4 rounded-2xl slide-in slide-in-delay-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input
              id="ri-search"
              type="text"
              placeholder="Cari no order, customer, no polisi, nama part…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ri-input w-full pl-10"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Status</label>
            <select id="ri-filter-status" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="ri-input min-w-[160px]">
              <option value="All">Semua Status</option>
              <option value="BELUM_DIPASANG">Belum Dipasang</option>
              <option value="BELUM_DIAMBIL">Belum Diambil</option>
              <option value="OVERDUE">Overdue &gt; 3 Hari</option>
            </select>
          </div>

          {/* SA */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">SA</label>
            <select id="ri-filter-sa" value={filterSA} onChange={e => { setFilterSA(e.target.value); setPage(1); }}
              className="ri-input min-w-[140px]">
              <option value="">Semua SA</option>
              {saList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Foreman */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Foreman</label>
            <select id="ri-filter-foreman" value={filterForeman} onChange={e => { setFilterForeman(e.target.value); setPage(1); }}
              className="ri-input min-w-[140px]">
              <option value="">Semua Foreman</option>
              {foremanList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Dari Tanggal
            </label>
            <input id="ri-filter-from" type="date" value={filterFrom}
              onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
              className="ri-input" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Sampai
            </label>
            <input id="ri-filter-to" type="date" value={filterTo}
              onChange={e => { setFilterTo(e.target.value); setPage(1); }}
              className="ri-input" />
          </div>

          {/* Reset */}
          {(search || filterStatus !== "All" || filterSA || filterForeman || filterFrom || filterTo) && (
            <button
              onClick={() => {
                setSearch(""); setFilterStatus("All"); setFilterSA("");
                setFilterForeman(""); setFilterFrom(""); setFilterTo(""); setPage(1);
              }}
              className="ri-btn ri-btn-ghost mt-auto"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="ri-table-wrapper slide-in slide-in-delay-5 mb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 rounded-full border-t-transparent animate-spin"
              style={{ borderColor: "rgba(6,182,212,0.4)", borderTopColor: "transparent" }} />
            <p className="text-white/30 text-sm font-medium tracking-wide">Memuat data…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="ri-empty">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-white/50 font-semibold text-base">Tidak ada data ditemukan</p>
            <p className="text-white/25 text-sm mt-1">Semua part sudah dipasang dan diambil 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ri-table">
              <thead>
                <tr>
                  <th className="ri-th">No Order</th>
                  <th className="ri-th">Customer</th>
                  <th className="ri-th">No Polisi</th>
                  <th className="ri-th">SA</th>
                  <th className="ri-th">Foreman</th>
                  <th className="ri-th">Nama Part</th>
                  <th className="ri-th text-center">Qty</th>
                  <th className="ri-th">Tgl Order</th>
                  <th className="ri-th">Part Datang</th>
                  <th className="ri-th">Status Gudang</th>
                  <th className="ri-th">Status Pasang</th>
                  <th className="ri-th">Umur Pending</th>
                  <th className="ri-th text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`ri-tr ${item.is_overdue ? "ri-tr-overdue" : ""}`}
                  >
                    {/* No Order */}
                    <td className="ri-td ri-td-no">
                      <span className="font-bold text-xs font-mono"
                        style={{ color: "#EB0A1E" }}>
                        {item.no_order}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="ri-td">
                      <div className="font-semibold text-white/85 text-sm leading-tight">{item.nama_pelanggan || "–"}</div>
                    </td>

                    {/* No Polisi */}
                    <td className="ri-td">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                        {item.no_polisi || "–"}
                      </span>
                    </td>

                    {/* SA */}
                    <td className="ri-td">
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Users className="w-3 h-3 text-blue-400 shrink-0" />
                        {item.sa || <span className="text-white/25">–</span>}
                      </div>
                    </td>

                    {/* Foreman */}
                    <td className="ri-td">
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <Users className="w-3 h-3 text-violet-400 shrink-0" />
                        {item.foreman || <span className="text-white/25">–</span>}
                      </div>
                    </td>

                    {/* Nama Part */}
                    <td className="ri-td">
                      <div className="font-medium text-white/80 text-sm max-w-[180px] truncate" title={item.nama_part}>
                        {item.nama_part}
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="ri-td text-center">
                      <span className="font-bold text-white/75">{item.qty}</span>
                      <span className="text-[10px] text-white/30 ml-0.5">PCS</span>
                    </td>

                    {/* Tgl Order */}
                    <td className="ri-td">
                      <span className="text-white/50 text-xs">{formatDate(item.tgl_order)}</span>
                    </td>

                    {/* Tanggal Part Datang */}
                    <td className="ri-td">
                      {item.tanggal_part_datang ? (
                        <span className="text-xs text-cyan-400">{formatDate(item.tanggal_part_datang)}</span>
                      ) : (
                        <span className="text-white/25 text-xs">–</span>
                      )}
                    </td>

                    {/* Status Gudang */}
                    <td className="ri-td">
                      <StatusGudangBadge status={item.status_gudang} />
                    </td>

                    {/* Status Pemasangan */}
                    <td className="ri-td">
                      <StatusPasangBadge status={item.status_pemasangan} overdue={item.is_overdue} />
                    </td>

                    {/* Umur Pending */}
                    <td className="ri-td">
                      <UmurBadge umur={item.umur_pending} />
                    </td>

                    {/* Action */}
                    <td className="ri-td">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.status_pemasangan !== "SELESAI" && (
                          <button
                            id={`btn-dipasang-${item.id}`}
                            onClick={() => handleDipasang(item)}
                            disabled={actionLoading === item.id}
                            className="ri-btn ri-btn-green"
                            title="Tandai sudah dipasang"
                          >
                            {actionLoading === item.id ? (
                              <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Dipasang
                          </button>
                        )}

                        {item.status_gudang !== "DIAMBIL" && (
                          <button
                            id={`btn-diambil-${item.id}`}
                            onClick={() => handleDiambil(item)}
                            disabled={actionLoading === item.id}
                            className="ri-btn ri-btn-orange"
                            title="Tandai sudah diambil dari gudang"
                          >
                            {actionLoading === item.id ? (
                              <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <PackageCheck className="w-3 h-3" />
                            )}
                            Diambil
                          </button>
                        )}

                        <button
                          id={`btn-detail-${item.id}`}
                          onClick={() => setDetailItem(item)}
                          className="ri-btn ri-btn-ghost"
                          title="Lihat detail"
                        >
                          <Eye className="w-3 h-3" /> Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4 slide-in slide-in-delay-6">
          <p className="text-xs text-white/30 font-medium">
            Menampilkan{" "}
            <span className="text-white/60 font-bold">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalRecords)}</span>
            {" "}dari{" "}
            <span className="text-white/60 font-bold">{totalRecords}</span> data
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="ri-page-btn"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pg: number;
              if (totalPages <= 5) {
                pg = i + 1;
              } else if (page <= 3) {
                pg = i + 1;
              } else if (page >= totalPages - 2) {
                pg = totalPages - 4 + i;
              } else {
                pg = page - 2 + i;
              }
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`ri-page-btn ${pg === page ? "active" : ""}`}
                >
                  {pg}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="ri-page-btn"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
