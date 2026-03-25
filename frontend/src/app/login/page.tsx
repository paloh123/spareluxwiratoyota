"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force dark theme on login page
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.fetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      Cookies.set("token", data.token, { expires: 0.5 });
      Cookies.set("user", JSON.stringify(data.user), { expires: 0.5 });
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #080c14 0%, #0d1117 40%, #150306 100%)",
      }}
    >
      {/* Animated Background Blobs */}
      <div
        className="pointer-events-none absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[80px] animate-blob"
        style={{ background: "radial-gradient(circle, #EB0A1E 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[80px] animate-blob"
        style={{ background: "radial-gradient(circle, #EB0A1E 0%, transparent 70%)", animationDelay: "4s" }}
      />
      <div
        className="pointer-events-none absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full opacity-[0.03] blur-[60px]"
        style={{ background: "radial-gradient(circle, #ff4d5e 0%, transparent 70%)" }}
      />

      {/* Grid lines subtle overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating particles */}
      {mounted && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                background: `rgba(235, 10, 30, ${Math.random() * 0.3 + 0.1})`,
                left: `${10 + i * 16}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-[400px] mx-4 rounded-3xl overflow-hidden transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Card top gradient bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, #EB0A1E, #ff4d5e, #EB0A1E)", backgroundSize: "200% 100%", animation: "gradient-x 3s ease infinite" }}
        />

        <div className="p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 pulse-glow float-anim luxury-glow"
              style={{
                background: "linear-gradient(135deg, #EB0A1E 0%, #c90011 100%)",
                boxShadow: "0 8px 32px rgba(235,10,30,0.4), 0 0 0 1px rgba(235,10,30,0.3)",
              }}
            >
              <span className="text-white font-black text-2xl tracking-tight font-display">T</span>
            </div>
            <h1 className="sparelux-text text-4xl font-display leading-tight tracking-tight">
              SPARELUX
            </h1>
            <p className="system-text text-sm font-bold text-white/90 tracking-[0.3em] mt-1 uppercase">
              Wira Toyota
            </p>
            <p className="text-white/40 text-[9px] font-bold tracking-[0.2em] mt-4 uppercase border-t border-white/10 pt-3">
              Smart Spareparts Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200 group-focus-within:text-[#EB0A1E]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@sparelux.system"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(235,10,30,0.5)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(235,10,30,0.1), 0 0 20px rgba(235,10,30,0.05)";
                    e.target.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200 group-focus-within:text-[#EB0A1E]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm font-medium text-white placeholder-white/20 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(235,10,30,0.5)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(235,10,30,0.1), 0 0 20px rgba(235,10,30,0.05)";
                    e.target.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "rgba(255,255,255,0.05)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-brand ripple-container w-full py-3.5 rounded-xl font-bold text-sm tracking-wide mt-2 flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 flex items-center justify-center gap-2 text-[10px] font-medium" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)" }}>
            <span className="status-dot bg-emerald-400" style={{ width: 6, height: 6 }} />
            <span>Secure Access · SPARELUX WIRA TOYOTA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
