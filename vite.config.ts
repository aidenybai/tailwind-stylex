import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx}": "vp check --fix",
  },
  test: {
    projects: ["packages/tailwind-stylex/vite.config.ts"],
  },
  fmt: {
    ignorePatterns: [
      "packages/tailwind-stylex/tokens.stylex.d.ts",
      "packages/tailwind-stylex/tokens.stylex.js",
    ],
    semi: true,
    singleQuote: false,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-var": "error",
      eqeqeq: "error",
    },
    ignorePatterns: ["node_modules", "dist", "coverage", "pnpm-lock.yaml"],
  },
});
