module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cyberpunk: {
          50: "#0ff0fc",
          100: "#00e1ff",
          200: "#00c8e8",
          300: "#00b0d1",
          400: "#0097ba",
          500: "#007fa3",
          600: "#00668c",
          700: "#004d75",
          800: "#00345e",
          900: "#001b47"
        },
        neon: {
          pink: "#ff00ff",
          blue: "#00ffff",
          green: "#00ff00",
          purple: "#8a2be2"
        }
      },
      fontFamily: {
        'mono': ['"Fira Code"', 'monospace'],
        'cyber': ['"Orbitron"', 'sans-serif']
      }
    }
  },
  plugins: []
}