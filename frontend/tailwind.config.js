/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark palette (primary)
        bg: {
          DEFAULT: "#0F1117",
          secondary: "#1A1D27",
          tertiary: "#242736",
        },
        surface: {
          DEFAULT: "#1A1D27",
          hover: "#242736",
          active: "#2D3044",
        },
        border: {
          DEFAULT: "#2D3044",
          light: "#3A3D52",
        },
        accent: {
          DEFAULT: "#6C63FF",
          light: "#8B83FF",
          dark: "#5046E5",
          muted: "rgba(108, 99, 255, 0.15)",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#34D399",
          muted: "rgba(16, 185, 129, 0.15)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          muted: "rgba(245, 158, 11, 0.15)",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          muted: "rgba(239, 68, 68, 0.15)",
        },
        text: {
          primary: "#F0F2FF",
          secondary: "#A0A4B8",
          muted: "#6B6F82",
        },
        // Light mode overrides
        "light-bg": "#FAFBFF",
        "light-surface": "#FFFFFF",
        "light-border": "#E2E4EF",
        "light-text": "#1A1D27",
        "light-text-secondary": "#5A5D72",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        panel: "0 32px 64px rgba(0, 0, 0, 0.38)",
        glow: "0 0 80px rgba(108, 99, 255, 0.12)",
        soft: "0 18px 36px rgba(0, 0, 0, 0.22)",
        card: "0 4px 24px rgba(0, 0, 0, 0.25)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.35)",
        "accent-glow": "0 0 20px rgba(108, 99, 255, 0.3)",
      },
      borderRadius: {
        card: "16px",
        shell: "24px",
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px)",
        "grid-dots":
          "radial-gradient(circle at center, rgba(108,99,255,0.3) 0.8px, transparent 0.8px)",
        "accent-gradient": "linear-gradient(135deg, #6C63FF 0%, #8B83FF 50%, #A78BFA 100%)",
        "success-gradient": "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        "danger-gradient": "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
      },
      backgroundSize: {
        "grid-lines": "36px 36px",
        "grid-dots": "20px 20px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "typewriter": "typewriter 0.05s steps(1)",
        "shimmer": "shimmer 2s linear infinite",
        "progress-ring": "progressRing 1s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: 0, transform: "translateX(20px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        progressRing: {
          "0%": { strokeDashoffset: 283 },
        },
      },
      transitionDuration: {
        180: "180ms",
      },
    },
  },
  plugins: [],
};
