/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#234536',
          50: '#f0f5f2',
          100: '#dde9e3',
          200: '#bed5c9',
          500: '#2d5845',
          600: '#234536',
          700: '#1b372b',
          800: '#142a21',
          900: '#0d1c16',
        },
        olive: {
          DEFAULT: '#5F7147',
          50: '#f6f8f2',
          100: '#ebf1e3',
          500: '#5F7147',
          600: '#4e5d3a',
          700: '#3e4a2e',
        },
        sand: {
          DEFAULT: '#C6A46A',
          50: '#fbf8f2',
          100: '#f6eee2',
          200: '#ebdcc4',
          500: '#C6A46A',
          600: '#ad8b53',
          700: '#8e7141',
        },
        cream: {
          DEFAULT: '#F7F4ED',
          50: '#fdfcf9',
          100: '#F7F4ED',
          200: '#ede8dd',
          300: '#ded7c5',
        },
        app: {
          bg: '#F7F4ED',
          surface: '#FFFFFF',
          border: '#DEDCCF',
          borderLight: '#ECEAE2',
          text: '#252922',
          subtext: '#625D53',
          muted: '#8C877D',
        },
        status: {
          success: '#16845B',
          warning: '#D97706',
          danger: '#C62828',
          info: '#3B6E8F',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        control: '10px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(35, 69, 54, 0.05), 0 1px 2px -1px rgba(35, 69, 54, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(35, 69, 54, 0.08), 0 2px 4px -2px rgba(35, 69, 54, 0.08)',
        modal: '0 20px 25px -5px rgba(35, 69, 54, 0.15), 0 8px 10px -6px rgba(35, 69, 54, 0.1)',
      }
    },
  },
  plugins: [],
}
