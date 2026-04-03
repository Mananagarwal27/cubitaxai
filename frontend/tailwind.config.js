/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Antigravity-inspired palette ───────────────── */
        bg: {
          DEFAULT: "#07090F",
          secondary: "#0E1420",
          tertiary: "#141B2D",
        },
        surface: {
          DEFAULT: "#0E1420",
          hover: "#141B2D",
          active: "#1A2238",
          elevated: "#141B2D",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          light: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.15)",
        },
        accent: {
          DEFAULT: "#4F6EF7",
          light: "#6B8AFF",
          dark: "#3B55D4",
          muted: "rgba(79,110,247,0.15)",
          glow: "rgba(79,110,247,0.25)",
        },
        mint: {
          DEFAULT: "#00D4AA",
          light: "#33E0BE",
          muted: "rgba(0,212,170,0.15)",
        },
        warning: {
          DEFAULT: "#F5A623",
          light: "#FFB94D",
          muted: "rgba(245,166,35,0.15)",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          muted: "rgba(239,68,68,0.15)",
        },
        text: {
          primary: "#F0F4FF",
          secondary: "#8892B0",
          muted: "#4A5568",
        },
        /* ── Legacy brand aliases ───────────────────────── */
        navy: {
          DEFAULT: "#0E1420",
          border: "rgba(255,255,255,0.06)",
        },
        purple: {
          DEFAULT: "#4F6EF7",
          light: "#6B8AFF",
        },
        cyan: {
          DEFAULT: "#00D4AA",
        },
        amber: {
          DEFAULT: "#F5A623",
        },
        /* ── Semantic aliases ──────────────────────────── */
        success: {
          DEFAULT: "#00D4AA",
          light: "#33E0BE",
          muted: "rgba(0,212,170,0.15)",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Syne'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "hero": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "hero-sm": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        glow: "0 0 80px rgba(79,110,247,0.10)",
        "glow-lg": "0 0 120px rgba(79,110,247,0.15)",
        "glow-accent": "0 0 30px rgba(79,110,247,0.30)",
        card: "0 4px 24px rgba(0,0,0,0.40)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.50)",
        panel: "0 32px 64px rgba(0,0,0,0.50)",
      },
      borderRadius: {
        card: "16px",
        shell: "24px",
      },
      backgroundImage: {
        "grid-dots":
          "radial-gradient(circle, rgba(79,110,247,0.15) 1px, transparent 1px)",
        "mesh-gradient":
          "radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,212,170,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(79,110,247,0.04) 0%, transparent 50%)",
      },
      backgroundSize: {
        "grid-dots": "24px 24px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "slide-in-right": "slideInRight 0.4s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "count-up": "countUp 1s ease-out forwards",
        "mesh": "meshMove 20s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        fadeInUp: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: 0, transform: "translateX(20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: 0.4 },
          "50%": { opacity: 1 },
        },
        meshMove: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(10px, -20px) scale(1.05)" },
          "50%": { transform: "translate(-5px, 10px) scale(0.98)" },
          "75%": { transform: "translate(-10px, -10px) scale(1.02)" },
        },
      },
      transitionDuration: {
        180: "180ms",
      },
    },
  },
  plugins: [],
};
