// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // React Native Reanimated drives animations by mutating shared values
      // (e.g. `scale.value = withTiming(...)`). The React Compiler's
      // immutability rule false-positives on this idiomatic pattern.
      "react-hooks/immutability": "off",
      // The remaining compiler rules flag common, correct patterns here
      // (load-on-mount effects, SSR hydration flags, syncing form state when
      // a modal opens, and passing callbacks into Reanimated worklets). Keep
      // them as warnings so they stay visible without failing the build.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);
