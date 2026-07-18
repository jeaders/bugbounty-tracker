module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px'
    },
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
      },
      animation: {
        'pulse-slow': 'pulse 3s linear infinite',
        'scan': 'scan 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      padding: {
        'safe': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)'
      }
    }
  },
  plugins: []
}
