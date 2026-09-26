/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#F2F7F4',
          100: '#E2ECE5',
          200: '#C5D8CB',
          300: '#9EBEA8',
          400: '#739F82',
          500: '#4D8260',
          600: '#2C5E43',
          700: '#224C35',
          800: '#1B3C2B',
          900: '#142E21',
        },
        clay: {
          50: '#FDF7F4',
          100: '#F9EDE7',
          200: '#F3DACF',
          300: '#E8B9A5',
          400: '#DA8F73',
          500: '#C85A32',
          600: '#AC4824',
          700: '#8E381A',
          800: '#752E17',
          900: '#5F2715',
        },
        parchment: {
          50: '#FCFBF9',
          100: '#FBF9F5',
          200: '#F5F1E8',
          300: '#EAE3D4',
          400: '#DCD1BD',
          500: '#C9BBA2',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Merriweather', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
