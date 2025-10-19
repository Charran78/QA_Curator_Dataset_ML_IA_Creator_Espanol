/** @type {import('tailwindcss').Config} */
export default {
  content: [ 
    "./index.html",        // Incluye tu archivo HTML principal
    "./src/**/*.{js,ts,jsx,tsx}", // Escanea todos los archivos JS/TS/JSX/TSX dentro de src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

