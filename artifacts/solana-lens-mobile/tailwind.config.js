/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0B0D13',
        panel: '#12151D',
        raised: '#191D28',
        line: '#232837',
        violet: '#8B6CFF',
        mint: '#3ECF8E',
      },
    },
  },
  plugins: [],
};