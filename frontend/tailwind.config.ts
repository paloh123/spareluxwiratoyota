import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          glow: "var(--brand-primary-glow)",
          dim: "var(--brand-primary-dim)",
          gray: "#f0f2f8",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.06)",
        card: "0 8px 32px rgba(0, 0, 0, 0.08)",
        float: "0 16px 48px rgba(0, 0, 0, 0.12)",
        glow: "0 0 20px var(--brand-primary-glow)",
        "glow-lg": "0 0 40px var(--brand-primary-glow), 0 0 80px rgba(235, 10, 30, 0.1)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.15)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(235,10,30,0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(235,10,30,0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "blob": {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
        },
        "dot-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
        "scale-in":   "scale-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) both",
        "spin-slow":  "spin-slow 8s linear infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "float":      "float 4s ease-in-out infinite",
        "shimmer":    "shimmer 1.5s infinite",
        "blob":       "blob 8s ease-in-out infinite",
        "dot-blink":  "dot-blink 2s ease-in-out infinite",
      },
      backgroundSize: {
        "300%": "300%",
        "400%": "400%",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
