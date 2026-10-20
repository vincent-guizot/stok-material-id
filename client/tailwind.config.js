/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        toko: {
          semen: '#64748b',
          besi: '#0284c7',
          cat: '#f59e0b',
          pipa: '#10b981',
          bata: '#ef4444',
        }
      },
      fontSize: {
        'giant': ['2.25rem', { lineHeight: '2.5rem' }],
        'super': ['3rem', { lineHeight: '1' }],
      }
    },
  },
  plugins: [],
}
