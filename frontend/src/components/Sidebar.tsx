"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Search, Package,
  PlusCircle, Users, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "SA", "Partsman"], gradient: "from-red-500 to-rose-600" },
  { href: "/rekap-order", label: "Rekap Order", icon: FileText, roles: ["Admin", "SA", "Partsman"], gradient: "from-blue-500 to-indigo-600" },
  { href: "/cari-data", label: "Cari Data", icon: Search, roles: ["Admin", "SA", "Partsman"], gradient: "from-violet-500 to-purple-600" },
  { href: "/mip", label: "MIP", icon: Package, roles: ["Admin", "SA", "Partsman"], gradient: "from-amber-500 to-orange-600" },
  { href: "/input-order", label: "Input Order", icon: PlusCircle, roles: ["Admin", "Partsman"], gradient: "from-emerald-500 to-teal-600" },
  { href: "/users", label: "User Management", icon: Users, roles: ["Admin"], gradient: "from-pink-500 to-fuchsia-600" },
];

export function Sidebar({ userRole = "Admin", isCollapsed }: { userRole?: string; isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative h-screen flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20",
        "border-r border-white/[0.06]",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
      style={{ background: "var(--sidebar-bg, #0d1117)" }}
    >
      {/* Subtle top-right glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-40 h-40 opacity-5 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #EB0A1E 0%, transparent 70%)" }}
      />

      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center border-b border-white/[0.06] shrink-0 transition-all duration-300",
        isCollapsed ? "h-[64px] px-0 justify-center" : "h-[64px] px-5 gap-3"
      )}>
        <div
          className="flex items-center justify-center rounded-xl font-black text-white text-xs tracking-widest shrink-0 pulse-glow luxury-glow"
          style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #EB0A1E 0%, #c90011 100%)",
            boxShadow: "0 4px 16px rgba(235,10,30,0.4)"
          }}
        >
          T
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="sparelux-text text-sm leading-tight font-display tracking-tight">SPARELUX</p>
            <p className="system-text text-[10px] font-bold text-white/90 tracking-[0.2em] mt-0.5 uppercase">WIRA TOYOTA</p>
            <p className="text-[7px] text-white/40 font-bold tracking-widest whitespace-nowrap mt-1 border-t border-white/10 pt-1 uppercase">
              Smart Spareparts Management System
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 flex flex-col gap-1 overflow-y-auto">
        {!isCollapsed && (
          <p className="text-white/25 text-[10px] font-semibold tracking-widest uppercase px-3 pb-2 pt-1">Navigation</p>
        )}

        {NAV_ITEMS.map((item) => {
          if (!item.roles.includes(userRole)) return null;
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "sidebar-item group flex items-center gap-3 rounded-xl transition-all duration-250 relative",
                isCollapsed ? "px-0 py-3 justify-center" : "px-3 py-2.5",
                isActive
                  ? "sidebar-item-active text-white"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              {/* Active indicator dot */}
              {isActive && !isCollapsed && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/60" />
              )}

              {/* Icon wrapper */}
              <div className={cn(
                "flex items-center justify-center rounded-lg shrink-0 transition-all duration-250",
                isActive
                  ? "bg-white/20 w-8 h-8"
                  : "w-8 h-8 bg-white/[0.04] group-hover:bg-white/[0.08]"
              )}>
                <Icon className={cn("transition-all duration-250", isActive ? "w-4 h-4 text-white" : "w-4 h-4")} />
              </div>

              {!isCollapsed && (
                <span className={cn("font-medium text-sm transition-all duration-250", isActive ? "text-white" : "")}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-white/[0.06] text-center">
          <p className="text-white/20 text-[10px] font-medium uppercase tracking-widest">© 2026 SPARELUX WIRA TOYOTA</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="status-dot bg-emerald-400" />
            <p className="text-emerald-400/60 text-[10px]">All systems operational</p>
          </div>
        </div>
      )}
    </aside>
  );
}
