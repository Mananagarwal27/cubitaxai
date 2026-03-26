/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1E1B4B",
          accent: "#7C3AED",
          success: "#059669",
          warning: "#D97706",
          danger: "#DC2626",
          surface: "#FFFFFF",
          background: "#F8FAFC"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 45px rgba(30, 27, 75, 0.08)"
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top, rgba(124,58,237,0.16), transparent 40%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        "hero-grid": "100% 100%, 36px 36px, 36px 36px"
      }
    }
  },
  plugins: []
};

