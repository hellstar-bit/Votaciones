@'
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindcss('./tailwind.config.js'),
    autoprefixer,
  ],
};
'@ | Out-File -FilePath "postcss.config.js" -Encoding UTF8