import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#d9e4ff',
          500: '#3b6bff',
          600: '#2753e6',
          700: '#1f43b8',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
