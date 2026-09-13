/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        epilogue: ['Epilogue', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        ceviche: {
          primary: '#133854',
          navy: '#0a1d37',
          marine: '#0057b7',
          sky: '#29b6f6',
          secondary: '#f37023',
          orange: '#ff6f00',
          amber: '#f7931e',
          gold: '#ffc107',
          lime: '#2ed573',
          chili: '#ef4444',
          sand: '#fef8f1'
        }
      }
    },
  },
  plugins: [],
}
