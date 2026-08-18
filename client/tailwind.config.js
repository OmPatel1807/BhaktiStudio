/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        silk: '#FAF9F6',
        'warm-linen': '#F4EFE6',
        'warm-beige': '#EFEAE1',
        'warm-border': '#E6DFD5',
        charcoal: '#2B2B2B',
        taupe: '#66625D',
        'warm-gold': '#C39B5A',
        'warm-gold-hover': '#B28A49',
      },
    },
  },
  plugins: [],
}
