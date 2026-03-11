import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0F172A",
          card: "#1E293B",
          elevated: "#293548",
          input: "#1E293B",
        },
        brand: {
          DEFAULT: "#3B82F6",
          dark: "#2563EB",
          dim: "rgba(59,130,246,0.12)",
        },
        success: {
          DEFAULT: "#10B981",
          dim: "rgba(16,185,129,0.12)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dim: "rgba(245,158,11,0.12)",
        },
        danger: {
          DEFAULT: "#EF4444",
          dim: "rgba(239,68,68,0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "toast-in": "toastIn 0.3s ease-out",
        "toast-out": "toastOut 0.3s ease-in forwards",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        toastIn: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        toastOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
