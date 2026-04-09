// Metro config for Expo + NativeWind (Story 4.3).
//
// `withNativeWind` wraps the default Expo config and registers the Metro
// transformer that compiles `global.css` + `className` props into the
// actual React Native style props at bundle time. Point it at `global.css`
// so NativeWind knows which stylesheet to compile.

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
