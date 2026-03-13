/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        steco: {
          gold: "#f5c56a",
          navy: "#0b1b2b"
        }
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        display: ["'Playfair Display'", "serif"]
      },
      boxShadow: {
        elegant: "0 18px 45px rgba(0,0,0,0.65)"
      }
    }
  },
  plugins: []
};

