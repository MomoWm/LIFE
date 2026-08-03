// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // One-off Node CLI scripts (run via `node scripts/x.js`), not part of the
    // Expo/RN app bundle — they need Node's globals, not the app's.
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
