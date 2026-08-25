import { access } from "node:fs/promises";
import path from "node:path";
import { createJiti } from "jiti";

import type { GenerateOptions, StyleXTailwindConfig } from "../public-types.js";

const CONFIG_FILE_NAMES = [
  "stylex-tailwind.config.ts",
  "stylex-tailwind.config.mts",
  "stylex-tailwind.config.js",
  "stylex-tailwind.config.mjs",
];

const fileExists = async (filePath: string) =>
  access(filePath)
    .then(() => true)
    .catch(() => false);

const findConfigPath = async (cwd: string, requestedPath?: string) => {
  if (requestedPath) {
    const configPath = path.resolve(cwd, requestedPath);
    if (!(await fileExists(configPath))) throw new Error(`Config not found at ${configPath}.`);
    return configPath;
  }

  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = path.join(cwd, fileName);
    if (await fileExists(configPath)) return configPath;
  }

  return path.join(cwd, CONFIG_FILE_NAMES[0]);
};

const loadConfigFile = async (configPath: string) => {
  if (!(await fileExists(configPath))) return {};
  const jiti = createJiti(import.meta.url);
  return jiti.import<StyleXTailwindConfig>(configPath, { default: true });
};

export const loadConfig = async (
  options: GenerateOptions,
): Promise<ResolvedStyleXTailwindConfig> => {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const configPath = await findConfigPath(cwd, options.configPath);
  const projectRoot = path.dirname(configPath);
  const config = options.config ?? (await loadConfigFile(configPath));
  const identifier = config.identifier ?? "tw";

  if (!/^[A-Za-z_$][\w$]*$/.test(identifier)) {
    throw new Error(
      `The utility identifier ${JSON.stringify(identifier)} is not valid JavaScript.`,
    );
  }

  return {
    content: config.content ?? ["src/**/*.{js,jsx,mjs,mts,ts,tsx}"],
    identifier,
    input: config.input ? path.resolve(projectRoot, config.input) : undefined,
    output: path.resolve(projectRoot, config.output ?? "src/styles/tailwind.stylex.ts"),
    projectRoot,
    safelist: config.safelist ?? [],
  };
};
