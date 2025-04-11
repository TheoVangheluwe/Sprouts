module.exports = {
  future: {
    // removeDeprecatedGapUtilities: true,
    // purgeLayersByDefault: true,
  },
  purge: [],
  theme: {
    extend: {
      colors: {
        darkBlue: "#171738", // Arrière-plan du header
        deepBlue: "#2E1760", // Couleur de fond générale
        brightBlue: "#3423A6", // Accentuation des liens
        softBlue: "#7180B9", // Hover sur les liens
        lightGreen: "#DFF3E4", // Texte clair
      }
    },
  },
  variants: {},
  plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
  ],
}