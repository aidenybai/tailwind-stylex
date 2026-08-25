import { transformAsync } from "@babel/core";
import stylexPlugin from "@stylexjs/babel-plugin";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { generateTokens } from "../scripts/generate-tokens.js";

const packageRoot = path.resolve(import.meta.dirname, "..");
const tokensPath = path.join(packageRoot, "tokens.stylex.js");

const babelOptions = {
  babelrc: false,
  configFile: false,
  plugins: [
    [
      stylexPlugin,
      {
        dev: false,
        runtimeInjection: false,
        unstable_moduleResolution: {
          rootDir: packageRoot,
          type: "commonJS",
        },
      },
    ],
  ],
};

describe("generated tokens", () => {
  it("matches the installed Tailwind theme", async () => {
    const result = await generateTokens({ check: true });

    expect(result.changed).toBe(false);
    expect(result.tokenCount).toBeGreaterThan(400);
    expect(result.keyframeCount).toBe(4);
  });

  it("compiles the generated module with StyleX", async () => {
    const source = await readFile(tokensPath, "utf8");
    const result = await transformAsync(source, {
      ...babelOptions,
      filename: tokensPath,
    });

    expect(result?.code).not.toContain("stylex.defineConsts");
    expect(result?.code).not.toContain("stylex.keyframes");
  });

  it("resolves package tokens in StyleX styles", async () => {
    const source = `
      import * as stylex from "@stylexjs/stylex";
      import { animations, colors, mediaQueries, radii, spacing } from "../tokens.stylex";

      export const styles = stylex.create({
        root: {
          animation: animations.spin,
          borderRadius: radii.full,
          color: {
            default: colors.stone900,
            [mediaQueries.md]: colors.current,
          },
          padding: spacing[4],
        },
      });
    `;
    const result = await transformAsync(source, {
      ...babelOptions,
      filename: path.join(packageRoot, "tests", "consumer.ts"),
    });

    expect(result?.code).not.toContain("stylex.create");
    expect(result?.code).toContain("$$css");
  });
});
