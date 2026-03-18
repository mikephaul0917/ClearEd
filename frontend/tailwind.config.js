/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcc5d3',
          300: '#8b95a7',
          400: '#5e6c84',
          500: '#1e293b',
          600: '#0f172a',
          700: '#020617',
          800: '#020617',
          900: '#020617',
        },
        background: {
          DEFAULT: '#f8fafc',
        },
        card: {
          DEFAULT: '#ffffff',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
