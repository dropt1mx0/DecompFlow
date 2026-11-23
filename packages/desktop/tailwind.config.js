/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        anchored: {
          bg: "#131418",
          sidebar: "#0f1013",
          card: "#181a20",
          cardHover: "#1f222a",
          border: "#232630",
          borderSubtle: "#1c1e26",
          text: "#f0f1f5",
          muted: "#8b8f9e",
          dimmed: "#565a69",
          cyan: "#38bdf8",
          emerald: "#22c55e",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
