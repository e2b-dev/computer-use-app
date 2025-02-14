/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FF8800",
          foreground: "#FFFFFF",
        },
      },
      animation: {
        'spin-reverse': 'spin 2s linear infinite reverse',
        'bounce-delay-1': 'bounce 1s infinite 100ms',
        'bounce-delay-2': 'bounce 1s infinite 200ms',
        'bounce-delay-3': 'bounce 1s infinite 300ms',
      },
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
      },
      ringColor: {
        'primary': '#FF8800',
      },
      ringOpacity: {
        'primary': '0.2',
      },
    },
  },
  plugins: [],
} 