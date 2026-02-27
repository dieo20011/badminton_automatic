/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  prefix: 'tw-',
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
};
