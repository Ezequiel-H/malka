/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'light-bg': '#f9f2e8',
        'primary': '#689b78',
      },
    },
  },
  plugins: [],
}
