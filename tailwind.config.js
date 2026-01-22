/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Auth colors
        primary: "#7f13ec",
        "background-light": "#f7f6f8",
        "background-dark": "#191022",
        "input-bg": "#211c27",
        "input-border": "#473b54",
        // Calendar colors
        "cal-primary": "#135bec",
        "cal-bg": "#101622",
        "cal-sidebar": "#111318",
        "cal-card": "#1e293b",
        "cal-border": "#282e39",
        "cal-hover": "#1e232b",
        "deep-work": "#8b5cf6",
        "shallow-work": "#10b981",
        // Block colors for "Otro"
        "block-blue": "#3B82F6",
        "block-red": "#EF4444",
        "block-yellow": "#F59E0B",
        "block-pink": "#EC4899",
        "block-orange": "#F97316",
        "block-gray": "#6B7280",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
