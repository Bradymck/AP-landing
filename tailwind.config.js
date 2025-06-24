/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue': {
          400: '#60A5FA',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        'purple': {
          600: '#9333EA',
          700: '#7E22CE',
        }
      }
    },
  },
  plugins: [],
} 