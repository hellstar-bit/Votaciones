/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sena: {
          500: '#39A900',
          600: '#2d8400',
        },
      },
    },
  },
  plugins: [],
}