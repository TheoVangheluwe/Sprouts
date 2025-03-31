module.exports = {
  future: {
    // removeDeprecatedGapUtilities: true,
    // purgeLayersByDefault: true,
  },
  purge: [],
  theme: {
    extend: {
      colors: {
        thistle: "#CDB4DB",
        fairyTale: "#FFC8DD",
        carnationPink: "#FFAFCC",
        uranianBlue: "#BDE0FE",
        lightSkyBlue: "#A2D2FF"
      }
    },
  },
  variants: {},
  plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
  ],
}