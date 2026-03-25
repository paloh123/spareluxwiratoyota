"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Menu, LogOut, Bell, User, ChevronDown, Settings, Moon, Sun } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userDataStr = Cookies.get("user");
    if (!userDataStr) {
      router.push("/login");
    } else {
      try { setUser(JSON.parse(userDataStr)); }
      catch { router.push("/login"); }
    }
    // Load saved theme
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = saved || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, [router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    router.push("/login");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "#EB0A1E";
      case "SA": return "#3b82f6";
      case "Partsman": return "#10b981";
      default: return "#EB0A1E";
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm font-medium tracking-widest uppercase">Initializing SPARELUX WIRA TOYOTA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar isCollapsed={isCollapsed} userRole={user.role} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="h-16 flex items-center justify-between px-5 shrink-0 z-10"
          style={{
            background: "var(--header-bg)",
            borderBottom: "1px solid var(--header-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>

            {/* Breadcrumb pulse indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="status-dot bg-emerald-400" style={{ width: 6, height: 6 }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Live</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2" ref={profileRef}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-indigo-400" />
              }
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 relative"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-dot-blink"
                  style={{ background: "#EB0A1E", boxShadow: "0 0 6px rgba(235,10,30,0.8)" }}
                />
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 top-11 w-72 rounded-2xl shadow-float overflow-hidden z-50 animate-scale-in"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="px-4 py-3 border-b text-xs font-semibold tracking-wide uppercase" style={{ borderColor: "var(--card-border)", color: "var(--text-muted)" }}>
                    Notifications
                  </div>
                  {[
                    { msg: "5 orders overdue – check immediately", time: "2m ago", urgent: true },
                    { msg: "New order from Branch A submitted", time: "15m ago", urgent: false },
                    { msg: "Monthly report ready for review", time: "1h ago", urgent: false },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3 items-start cursor-pointer transition-all hover:bg-white/5">
                      <span className={`mt-1 status-dot flex-shrink-0 ${n.urgent ? "bg-red-500" : "bg-emerald-400"}`} style={{ width: 7, height: 7 }} />
                      <div>
                        <p className="text-xs font-medium leading-snug" style={{ color: "var(--foreground)", opacity: 0.9 }}>{n.msg}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 mx-1" style={{ background: "var(--card-border)" }} />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${getRoleColor(user.role)}, ${getRoleColor(user.role)}99)`,
                    boxShadow: `0 2px 8px ${getRoleColor(user.role)}50`
                  }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{user.name}</p>
                  <p className="text-[10px] font-medium" style={{ color: getRoleColor(user.role) }}>{user.role}</p>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-11 w-52 rounded-2xl shadow-float overflow-hidden z-50 animate-scale-in"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "var(--card-border)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{user.name}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: getRoleColor(user.role) }}>{user.role}</p>
                  </div>
                  <div className="p-1.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/10" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/10" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <hr className="my-1" style={{ borderColor: "var(--card-border)" }} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-red-500/10"
                      style={{ color: "#EB0A1E" }}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7 page-transition">
          <div className="max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
