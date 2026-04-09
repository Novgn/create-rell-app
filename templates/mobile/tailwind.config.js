// NativeWind 4.x Tailwind config for {{projectName}}.
//
// NativeWind 4 depends on a classic `tailwind.config.js` (not the
// Tailwind 4 CSS-first config) because its Metro transformer reads this
// file synchronously at build time. Tailwind v3.x is therefore pinned as
// a devDependency specifically for NativeWind.
//
// The `content` globs must match every file that may contain className
// strings. Missing a path here means the utility classes in that file will
// silently not ship in the compiled stylesheet.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
