/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Government-themed color palette
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#1d4ed8",   // Main brand blue
          600: "#1e40af",
          700: "#1e3a8a",
          800: "#1e3370",
          900: "#172554",
        },
        accent: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#16a34a",   // Green accent
          600: "#15803d",
          700: "#166534",
        },
        govt: {
          saffron: "#FF9933",
          white:   "#FFFFFF",
          green:   "#138808",
          navy:    "#000080",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
