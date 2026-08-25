import { readFile } from "node:fs/promises";
import path from "node:path";
import fastGlob from "fast-glob";

const escapeRegularExpression = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const scanUtilityIdentifiers = async (config: ResolvedStyleXTailwindConfig) => {
  const relativeOutputPath = path.relative(config.projectRoot, config.output);
  const sourcePaths = await fastGlob(config.content, {
    absolute: true,
    cwd: config.projectRoot,
    ignore: [relativeOutputPath, "**/node_modules/**", "**/dist/**"],
  });
  const identifierPattern = new RegExp(
    `\\b${escapeRegularExpression(config.identifier)}\\.([A-Za-z_$][\\w$]*)`,
    "g",
  );
  const identifiers = new Set<string>();

  for (const sourcePath of sourcePaths) {
    const source = await readFile(sourcePath, "utf8");
    for (const match of source.matchAll(identifierPattern)) {
      const identifier = match[1];
      if (identifier) identifiers.add(identifier);
    }
  }

  return identifiers;
};
