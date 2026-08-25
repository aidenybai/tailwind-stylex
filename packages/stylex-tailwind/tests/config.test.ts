import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadConfig } from "../src/lib/load-config.js";

const temporaryDirectories: string[] = [];
const fixturesDirectory = import.meta.dirname;

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((temporaryDirectory) => rm(temporaryDirectory, { force: true, recursive: true })),
  );
});

describe("loadConfig", () => {
  it("loads a TypeScript config relative to its project", async () => {
    const projectRoot = await mkdtemp(path.join(fixturesDirectory, "config-"));
    temporaryDirectories.push(projectRoot);
    await mkdir(path.join(projectRoot, "styles"));
    await writeFile(
      path.join(projectRoot, "stylex-tailwind.config.ts"),
      `export default { content: ["app/**/*.tsx"], input: "styles/theme.css", output: "generated/tailwind.stylex.ts" };`,
    );

    const config = await loadConfig({ cwd: projectRoot });

    expect(config.content).toEqual(["app/**/*.tsx"]);
    expect(config.input).toBe(path.join(projectRoot, "styles/theme.css"));
    expect(config.output).toBe(path.join(projectRoot, "generated/tailwind.stylex.ts"));
  });
});
