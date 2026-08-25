import { transformAsync } from "@babel/core";
import stylexPlugin from "@stylexjs/babel-plugin";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { generate } from "../src/generate.js";

const temporaryDirectories: string[] = [];
const fixturesDirectory = path.join(import.meta.dirname, "fixtures");

const createProject = async (source: string) => {
  const projectRoot = await mkdtemp(path.join(fixturesDirectory, "project-"));
  temporaryDirectories.push(projectRoot);
  await writeFile(path.join(projectRoot, "app.tsx"), source);
  return projectRoot;
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((temporaryDirectory) => rm(temporaryDirectory, { force: true, recursive: true })),
  );
});

describe("generate", () => {
  it("compiles used Tailwind tokens and utilities to StyleX", async () => {
    const projectRoot = await createProject(`
      export const styles = [
        tw.flex,
        tw.itemsCenter,
        tw.p4,
        tw.bgRed500,
        tw.textSm,
        tw.fontBold,
        tw.roundedLg,
        tw.blurSm,
        tw.srOnly,
      ];
    `);
    const output = "tailwind.stylex.ts";
    const result = await generate({
      config: {
        content: ["app.tsx"],
        output,
        safelist: ["w-1/2"],
      },
      cwd: projectRoot,
    });
    const outputPath = path.join(projectRoot, output);
    const generatedSource = await readFile(outputPath, "utf8");

    expect(result.changed).toBe(true);
    expect(result.utilityCount).toBe(10);
    expect(result.unsupportedCandidates).toEqual([]);
    expect(generatedSource).toContain("export const color = stylex.defineConsts({");
    expect(generatedSource).toContain('red500: "oklch(63.7% 0.237 25.331)"');
    expect(generatedSource).toContain("p4: {");
    expect(generatedSource).toContain('padding: "calc(0.25rem * 4)"');
    expect(generatedSource).toContain("w1_2: {");

    const transformed = await transformAsync(generatedSource, {
      babelrc: false,
      filename: outputPath,
      parserOpts: { plugins: ["typescript"] },
      plugins: [
        [
          stylexPlugin,
          {
            dev: false,
            runtimeInjection: false,
            unstable_moduleResolution: { rootDir: projectRoot, type: "commonJS" },
          },
        ],
      ],
    });
    expect(transformed?.code).toContain("$$css");

    const checkResult = await generate({
      check: true,
      config: { content: ["app.tsx"], output, safelist: ["w-1/2"] },
      cwd: projectRoot,
    });
    expect(checkResult.changed).toBe(false);
  });

  it("compiles custom Tailwind theme values", async () => {
    const projectRoot = await createProject(
      "export const styles = [tw.bgBrand500, tw.textBrand500];",
    );
    await writeFile(
      path.join(projectRoot, "theme.css"),
      `@import "tailwindcss/theme.css";
       @tailwind utilities;
       @theme { --color-brand-500: oklch(62% 0.2 250); }`,
    );

    const result = await generate({
      config: {
        content: ["app.tsx"],
        input: "theme.css",
        output: "tailwind.stylex.ts",
      },
      cwd: projectRoot,
    });
    const generatedSource = await readFile(path.join(projectRoot, "tailwind.stylex.ts"), "utf8");

    expect(result.utilityCount).toBe(2);
    expect(generatedSource).toContain('brand500: "oklch(62% 0.2 250)"');
    expect(generatedSource).toContain('backgroundColor: "oklch(62% 0.2 250)"');
  });

  it("rejects utilities with child selectors", async () => {
    const projectRoot = await createProject("export const styles = [tw.divideX2];");

    await expect(
      generate({
        config: { content: ["app.tsx"], output: "tailwind.stylex.ts" },
        cwd: projectRoot,
      }),
    ).rejects.toThrow("uses Tailwind behavior that StyleX cannot represent locally");
  });
});
