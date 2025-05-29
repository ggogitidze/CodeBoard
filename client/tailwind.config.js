module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        'jetbrains-mono': ['JetBrains Mono', 'monospace'],
      },
      dropShadow: {
        glow: '0 0 8px #9F91CC',
      },
      colors: {
        deepPurple: '#18122B',
        surfacePurple: '#393053',
        accentPurple: '#9F91CC',
        surfaceDark: '#443C68',
      },
    },
  },
  plugins: [],
}
