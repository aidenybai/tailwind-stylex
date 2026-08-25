import { readFile } from "node:fs/promises";
import path from "node:path";

export const readTailwindSource = async (config: ResolvedStyleXTailwindConfig) => {
  if (!config.input) {
    return {
      base: config.projectRoot,
      css: '@import "tailwindcss/theme.css";\n@tailwind utilities;\n',
    };
  }

  return {
    base: path.dirname(config.input),
    css: await readFile(config.input, "utf8"),
  };
};
