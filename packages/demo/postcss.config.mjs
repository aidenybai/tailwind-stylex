import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const babelConfig = require("./babel.config.json");

export default {
  plugins: {
    "@stylexjs/postcss-plugin": {
      babelConfig: {
        babelrc: false,
        parserOpts: {
          plugins: ["typescript", "jsx"],
        },
        plugins: babelConfig.plugins,
      },
      cwd: import.meta.dirname,
      include: ["app/**/*.{js,jsx,ts,tsx}", "node_modules/tailwind-stylex/tokens.stylex.js"],
      useCSSLayers: true,
    },
  },
};
