/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        navy: "var(--navy)",
        "navy-card": "var(--navy-card)",
        "navy-border": "var(--navy-border)",
        purple: "var(--purple)",
        "purple-light": "var(--purple-light)",
        cyan: "var(--cyan)",
        amber: "var(--amber)",
        green: "var(--green)",
        red: "var(--red)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)"
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Syne", "DM Sans", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 32px 64px rgba(0, 0, 0, 0.38)",
        glow: "0 0 80px rgba(124, 92, 252, 0.12)",
        soft: "0 18px 36px rgba(0, 0, 0, 0.22)"
      },
      borderRadius: {
        card: "16px",
        shell: "24px"
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(124,92,252,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.08) 1px, transparent 1px)",
        "grid-dots":
          "radial-gradient(circle at center, rgba(124,92,252,0.42) 0.8px, transparent 0.8px)",
        "logo-gradient": "linear-gradient(135deg, var(--purple) 0%, var(--purple-light) 52%, var(--cyan) 100%)"
      },
      backgroundSize: {
        "grid-lines": "36px 36px",
        "grid-dots": "20px 20px"
      },
      transitionDuration: {
        180: "180ms"
      }
    }
  },
  plugins: []
};
