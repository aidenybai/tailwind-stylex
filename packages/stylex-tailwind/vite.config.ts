import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";

const packageManifest = JSON.parse(readFileSync("package.json", "utf8"));
const licenseBanner = `/**
 * @license stylex-tailwind
 *
 * Copyright (c) Aiden Bai
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */`;

export default defineConfig({
  pack: {
    banner: licenseBanner,
    clean: true,
    define: {
      "process.env.VERSION": JSON.stringify(packageManifest.version),
    },
    deps: {
      neverBundle: ["@stylexjs/stylex", "@tailwindcss/node", "fast-glob", "jiti", "tailwindcss"],
    },
    dts: true,
    entry: {
      index: "./src/index.ts",
    },
    format: ["esm", "cjs"],
    hash: false,
    minify: process.env.NODE_ENV === "production",
    outDir: "./dist",
    platform: "node",
    sourcemap: false,
    target: "node22",
    treeshake: true,
  } satisfies PackUserConfig,
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "istanbul",
      reporter: ["text", "json", "json-summary", "html"],
    },
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
