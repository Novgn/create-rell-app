// PostCSS config for Tailwind 4.x (Story 4.3).
//
// Tailwind 4 ships as a single PostCSS plugin — `@tailwindcss/postcss` — and
// replaces the Tailwind 3.x `tailwindcss` + `autoprefixer` chain. No other
// plugins are needed unless you add your own.
//
// The `@import "tailwindcss"` line in app/globals.css is what actually
// triggers the plugin; this file just registers it with PostCSS.

const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
