import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { __unstable__loadDesignSystem } from "@tailwindcss/node";

import { candidateToIdentifier } from "./lib/candidate-to-identifier.js";
import { compileUtility } from "./lib/compile-utility.js";
import { getCandidateIndex } from "./lib/get-candidate-index.js";
import { getThemeTokenGroups } from "./lib/get-theme-token-groups.js";
import { loadConfig } from "./lib/load-config.js";
import { readTailwindSource } from "./lib/read-tailwind-source.js";
import { renderStyleXModule } from "./lib/render-stylex-module.js";
import { scanUtilityIdentifiers } from "./lib/scan-utility-identifiers.js";
import type { GenerateOptions, GenerateResult } from "./public-types.js";

const readExistingOutput = async (outputPath: string) =>
  readFile(outputPath, "utf8").catch(() => undefined);

export const generate = async (options: GenerateOptions = {}): Promise<GenerateResult> => {
  const config = await loadConfig(options);
  const tailwindSource = await readTailwindSource(config);
  const designSystem = await __unstable__loadDesignSystem(tailwindSource.css, {
    base: tailwindSource.base,
  });
  const themeCompilation = getThemeTokenGroups(designSystem.theme.entries());
  const classCandidateIndex = getCandidateIndex(designSystem.getClassList());
  const requestedIdentifiers = await scanUtilityIdentifiers(config);
  const sourceCandidates = new Set<string>();

  for (const identifier of requestedIdentifiers) {
    if (classCandidateIndex.ambiguousIdentifiers.has(identifier)) {
      throw new Error(
        `${config.identifier}.${identifier} maps to multiple Tailwind utilities. Add the intended class to safelist instead.`,
      );
    }

    const candidate = classCandidateIndex.candidatesByIdentifier.get(identifier);
    if (!candidate) {
      throw new Error(`${config.identifier}.${identifier} does not match a Tailwind utility.`);
    }
    sourceCandidates.add(candidate);
  }

  const candidates = Array.from(new Set([...sourceCandidates, ...config.safelist])).sort();
  const candidateAstNodes = designSystem.candidatesToAst(candidates);
  const compiledUtilities: CompiledUtility[] = [];
  const candidatesByUtilityIdentifier = new Map<string, string>();
  const unsupportedCandidates: string[] = [];

  for (let candidatePosition = 0; candidatePosition < candidates.length; candidatePosition++) {
    const candidate = candidates[candidatePosition];
    const utilityIdentifier =
      classCandidateIndex.identifiersByCandidate.get(candidate) ?? candidateToIdentifier(candidate);
    const compiledUtility = compileUtility(
      utilityIdentifier,
      candidateAstNodes[candidatePosition],
      themeCompilation.themeVariables,
    );

    if (compiledUtility) {
      const existingCandidate = candidatesByUtilityIdentifier.get(utilityIdentifier);
      if (existingCandidate && existingCandidate !== candidate) {
        throw new Error(
          `${existingCandidate} and ${candidate} both map to ${config.identifier}.${utilityIdentifier}.`,
        );
      }
      candidatesByUtilityIdentifier.set(utilityIdentifier, candidate);
      compiledUtilities.push(compiledUtility);
    } else if (sourceCandidates.has(candidate)) {
      throw new Error(
        `${config.identifier}.${utilityIdentifier} uses Tailwind behavior that StyleX cannot represent locally.`,
      );
    } else {
      unsupportedCandidates.push(candidate);
    }
  }

  compiledUtilities.sort((firstUtility, secondUtility) =>
    firstUtility.identifier.localeCompare(secondUtility.identifier),
  );
  const output = renderStyleXModule(themeCompilation.groups, compiledUtilities);
  const existingOutput = await readExistingOutput(config.output);
  const changed = existingOutput !== output;

  if (changed && !options.check) {
    await mkdir(path.dirname(config.output), { recursive: true });
    await writeFile(config.output, output);
  }

  return {
    changed,
    outputPath: config.output,
    tokenCount: themeCompilation.tokenCount,
    unsupportedCandidates,
    utilityCount: compiledUtilities.length,
  };
};
