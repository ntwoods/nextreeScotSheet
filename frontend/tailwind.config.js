/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d8ebff',
          200: '#b6d7ff',
          300: '#84bbff',
          400: '#4a96ff',
          500: '#1f73ff',
          600: '#1356db',
          700: '#1041ad',
          800: '#103886',
          900: '#0f2f6a',
        },
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 48, 106, 0.12)',
      },
    },
  },
  plugins: [],
}