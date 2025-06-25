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
          50: '#f0fdf0',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#39A900',
          600: '#2d8400',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'sena': '0 4px 6px -1px rgba(57, 169, 0, 0.1), 0 2px 4px -1px rgba(57, 169, 0, 0.06)',
        'sena-lg': '0 10px 15px -3px rgba(57, 169, 0, 0.1), 0 4px 6px -2px rgba(57, 169, 0, 0.05)',
      },
    },
  },
  plugins: [],
}