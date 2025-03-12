// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        darkBackground: '#1a202c',
        darkText: '#a0aec0',
      },
    },
  },
  plugins: [],
};
