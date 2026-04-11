// NativeWind 4.x Tailwind config (Story 4.3).
//
// Unlike the web workspace — which uses Tailwind 4's CSS-first config —
// NativeWind 4 still depends on a classic `tailwind.config.js` because its
// Metro transformer reads the config file synchronously at build time.
// Tailwind v3.x is pinned as a devDependency specifically for NativeWind;
// the web workspace is free to use Tailwind v4.
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
