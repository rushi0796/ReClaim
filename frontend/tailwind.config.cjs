/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../frontend/index.html",
    "../frontend/src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          bg: '#F7F8FA',
          card: '#FFFFFF',
          secondary: '#F9FAFB',
          subtle: '#F2F4F7'
        },
        content: {
          primary: '#111827',
          secondary: '#667085',
          muted: '#98A2B3'
        },
        border: {
          subtle: '#EAECF0',
          medium: '#D0D5DD'
        },
        brand: {
          dark: '#111827',
          success: '#12B76A',
          warning: '#F79009',
          danger: '#F04438'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
