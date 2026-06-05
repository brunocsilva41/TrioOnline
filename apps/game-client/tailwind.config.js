/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space)", "var(--font-poppins)", "sans-serif"],
        display: ["var(--font-kanit)", "sans-serif"],
        mono: ["var(--font-space)", "monospace"],
      },
      colors: {
        trinity: {
          dark: "#020617",
          neon: "#34d399",
          gold: "#fbbf24",
          danger: "#f43f5e",
        }
      },
      boxShadow: {
        'neon-glow': '0 0 20px rgba(52, 211, 153, 0.3)',
        'gold-glow': '0 0 25px rgba(251, 191, 36, 0.3)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
