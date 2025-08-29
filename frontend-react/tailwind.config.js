/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          '50': '#eef2ff',
          '100': '#e0e7ff',
          '200': '#c7d2fe',
          '300': '#a5b4fc',
          '400': '#818cf8',
          '500': '#6366f1',
          '600': '#4f46e5',
          '700': '#4338ca',
          '800': '#3730a3',
          '900': '#312e81',
          '950': '#1e1b4b',
        },
      },
      keyframes: {
          'fade-in': {
              '0%': { opacity: '0', transform: 'translateY(10px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          'modal-overlay-in': {
              '0%': { opacity: '0' },
              '100%': { opacity: '1' },
          },
          'modal-in': {
              '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
              '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          }
      },
      animation: {
          'fade-in': 'fade-in 0.5s ease-out forwards',
          'modal-overlay-in': 'modal-overlay-in 0.2s ease-out forwards',
          'modal-in': 'modal-in 0.3s ease-out forwards',
      }
    }
  },
  plugins: [],
}