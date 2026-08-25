import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { transform } from "lightningcss";
import postcss from "postcss";
import { __unstable__loadDesignSystem, compile } from "tailwindcss";

import { STATIC_TOKEN_CANDIDATES } from "./constants.js";
import { resolveTailwindValue } from "./lib/resolve-tailwind-value.js";
import { toStyleXProperty } from "./lib/to-stylex-property.js";
import { toTokenKey } from "./lib/to-token-key.js";

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(import.meta.dirname, "..");
const javascriptOutputPath = path.join(packageRoot, "tokens.stylex.js");
const typesOutputPath = path.join(packageRoot, "tokens.stylex.d.ts");
const tailwindThemePath = require.resolve("tailwindcss/theme.css");

const tokenGroupPrefixes = [
  ["colors", "--color-"],
  ["breakpoints", "--breakpoint-"],
  ["containers", "--container-"],
  ["fontWeights", "--font-weight-"],
  ["fonts", "--font-"],
  ["textShadows", "--text-shadow-"],
  ["fontSizes", "--text-"],
  ["letterSpacing", "--tracking-"],
  ["lineHeights", "--leading-"],
  ["radii", "--radius-"],
  ["insetShadows", "--inset-shadow-"],
  ["dropShadows", "--drop-shadow-"],
  ["shadows", "--shadow-"],
  ["easings", "--ease-"],
  ["animations", "--animate-"],
  ["blurs", "--blur-"],
  ["perspectives", "--perspective-"],
  ["aspectRatios", "--aspect-"],
  ["defaults", "--default-"],
  ["maxWidths", "--max-width-"],
] satisfies [string, string][];

const tokenGroupOrder = [
  "colors",
  "spacing",
  "breakpoints",
  "mediaQueries",
  "containers",
  "fonts",
  "fontSizes",
  "fontSizeLineHeights",
  "fontWeights",
  "letterSpacing",
  "lineHeights",
  "radii",
  "shadows",
  "insetShadows",
  "dropShadows",
  "textShadows",
  "easings",
  "animations",
  "blurs",
  "perspectives",
  "aspectRatios",
  "defaults",
  "maxWidths",
];

const parseTailwindTheme = (source: string) => {
  const normalizedTheme = transform({
    code: Buffer.from(source),
    customAtRules: {
      theme: {
        body: "style-block",
        prelude: "*",
      },
    },
    filename: tailwindThemePath,
  });
  const root = postcss.parse(Buffer.from(normalizedTheme.code).toString(), {
    from: tailwindThemePath,
  });
  const variables = new Map<string, string>();
  const keyframes: GeneratedKeyframe[] = [];

  root.walkAtRules("theme", (themeRule) => {
    themeRule.walkDecls(/^--/, (declaration) => {
      variables.set(declaration.prop, declaration.value);
    });
    themeRule.walkAtRules("keyframes", (keyframeRule) => {
      const steps: GeneratedKeyframeStep[] = [];
      keyframeRule.each((stepNode) => {
        if (stepNode.type !== "rule") return;
        const declarations = new Map<string, string>();
        stepNode.walkDecls((declaration) => {
          declarations.set(toStyleXProperty(declaration.prop), declaration.value);
        });
        steps.push({ declarations, selector: stepNode.selector });
      });
      keyframes.push({ name: keyframeRule.params, steps });
    });
  });

  return { keyframes, variables };
};

const getTokenGroup = (cssVariable: string) => {
  if (cssVariable.startsWith("--text-") && cssVariable.endsWith("--line-height")) {
    return {
      exportName: "fontSizeLineHeights",
      keySource: cssVariable.slice("--text-".length, -"--line-height".length),
    };
  }

  for (const [exportName, prefix] of tokenGroupPrefixes) {
    const defaultVariable = prefix.slice(0, -1);
    if (cssVariable === defaultVariable) return { exportName, keySource: "default" };
    if (cssVariable.startsWith(prefix)) {
      return { exportName, keySource: cssVariable.slice(prefix.length) };
    }
  }

  throw new Error(`Unsupported Tailwind theme namespace: ${cssVariable}`);
};

const getCompiledTokenGroups = async (source: string, variables: Map<string, string>) => {
  const tailwindSource = `${source}\n@tailwind utilities;`;
  const designSystem = await __unstable__loadDesignSystem(tailwindSource);
  const spacingCandidates: CompiledTokenCandidate[] = designSystem
    .getClassList()
    .map(([candidate]) => candidate)
    .filter((candidate) => /^p-(?:px|\d+(?:\.\d+)?)$/.test(candidate))
    .map((candidate) => ({
      candidate,
      exportName: "spacing",
      key: candidate.slice(2),
      property: "padding",
    }));
  const candidates = [...STATIC_TOKEN_CANDIDATES, ...spacingCandidates];
  const compiler = await compile(tailwindSource);
  const compiledRoot = postcss.parse(compiler.build(candidates.map(({ candidate }) => candidate)));
  const groupsByName = new Map<string, GeneratedTokenGroup>();

  for (const tokenCandidate of candidates) {
    const escapedSelector = `.${tokenCandidate.candidate.replaceAll(".", "\\.")}`;
    let rawValue: string | undefined;
    compiledRoot.walkRules(escapedSelector, (rule) => {
      rule.walkDecls(tokenCandidate.property, (declaration) => {
        rawValue = declaration.value;
      });
    });
    if (rawValue === undefined)
      throw new Error(`Tailwind did not compile ${tokenCandidate.candidate}.`);
    const value = resolveTailwindValue(rawValue, variables);
    if (value === undefined) throw new Error(`Could not resolve ${tokenCandidate.candidate}.`);
    const group = groupsByName.get(tokenCandidate.exportName) ?? {
      exportName: tokenCandidate.exportName,
      tokens: [],
    };
    group.tokens.push({ key: tokenCandidate.key, value });
    groupsByName.set(tokenCandidate.exportName, group);
  }

  const spacingGroup = groupsByName.get("spacing");
  const spacingUnit = variables.get("--spacing");
  if (spacingGroup === undefined || spacingUnit === undefined) {
    throw new Error("Tailwind did not define spacing.");
  }
  spacingGroup.tokens.unshift({ key: "unit", value: spacingUnit });
  return groupsByName;
};

const getThemeTokenGroups = async (source: string, variables: Map<string, string>) => {
  const groupsByName = await getCompiledTokenGroups(source, variables);

  for (const [cssVariable, rawValue] of variables) {
    if (cssVariable === "--spacing") continue;
    const { exportName, keySource } = getTokenGroup(cssVariable);
    const value = resolveTailwindValue(rawValue, variables);
    if (value === undefined) throw new Error(`Could not resolve ${cssVariable}.`);
    const group = groupsByName.get(exportName) ?? { exportName, tokens: [] };
    group.tokens.push({ key: toTokenKey(keySource), value });
    groupsByName.set(exportName, group);
  }

  const breakpoints = groupsByName.get("breakpoints");
  if (breakpoints === undefined) throw new Error("Tailwind did not define breakpoints.");
  groupsByName.set("mediaQueries", {
    exportName: "mediaQueries",
    tokens: breakpoints.tokens.map((token) => ({
      key: token.key,
      value: `@media (min-width: ${token.value})`,
    })),
  });

  return tokenGroupOrder.map((groupName) => {
    const group = groupsByName.get(groupName);
    if (group === undefined) throw new Error(`Tailwind did not define ${groupName}.`);
    return group;
  });
};

const renderKeyframe = (keyframe: GeneratedKeyframe) => {
  const steps = keyframe.steps
    .map((step) => {
      const declarations = Array.from(
        step.declarations,
        ([property, value]) => `    ${property}: ${JSON.stringify(value)},`,
      ).join("\n");
      return `  ${JSON.stringify(step.selector)}: {\n${declarations}\n  },`;
    })
    .join("\n");
  return `const ${keyframe.name} = stylex.keyframes({\n${steps}\n});`;
};

const renderTokenValue = (
  group: GeneratedTokenGroup,
  token: GeneratedToken,
  keyframes: Set<string>,
) => {
  if (group.exportName !== "animations") return JSON.stringify(token.value);
  const keyframeName = token.value.split(" ")[0];
  if (!keyframes.has(keyframeName)) return JSON.stringify(token.value);
  return `\`\${${keyframeName}}${token.value.slice(keyframeName.length)}\``;
};

const renderTokenGroup = (group: GeneratedTokenGroup, keyframes: Set<string>) => {
  const tokens = group.tokens
    .map((token) => `  ${JSON.stringify(token.key)}: ${renderTokenValue(group, token, keyframes)},`)
    .join("\n");
  return `export const ${group.exportName} = stylex.defineConsts({\n${tokens}\n});`;
};

const renderJavascript = (groups: GeneratedTokenGroup[], keyframes: GeneratedKeyframe[]) => {
  const keyframeNames = new Set(keyframes.map((keyframe) => keyframe.name));
  const keyframeSource = keyframes.map(renderKeyframe).join("\n\n");
  const tokenSource = groups.map((group) => renderTokenGroup(group, keyframeNames)).join("\n\n");
  return `import * as stylex from "@stylexjs/stylex";\n\n${keyframeSource}\n\n${tokenSource}\n`;
};

const renderTypes = (groups: GeneratedTokenGroup[]) => {
  const groupSource = groups
    .map((group) => {
      const tokens = group.tokens
        .map((token) => `  readonly ${JSON.stringify(token.key)}: ${JSON.stringify(token.value)};`)
        .join("\n");
      return `export declare const ${group.exportName}: Readonly<{\n${tokens}\n}>;`;
    })
    .join("\n\n");
  return `${groupSource}\n`;
};

const readExistingFile = (filePath: string) => readFile(filePath, "utf8").catch(() => undefined);

export const generateTokens = async (
  options: GenerateTokensOptions = {},
): Promise<GenerateTokensResult> => {
  const tailwindTheme = await readFile(tailwindThemePath, "utf8");
  const { keyframes, variables } = parseTailwindTheme(tailwindTheme);
  const groups = await getThemeTokenGroups(tailwindTheme, variables);
  const javascript = renderJavascript(groups, keyframes);
  const types = renderTypes(groups);
  const [existingJavascript, existingTypes] = await Promise.all([
    readExistingFile(javascriptOutputPath),
    readExistingFile(typesOutputPath),
  ]);
  const changed = existingJavascript !== javascript || existingTypes !== types;

  if (changed && !options.check) {
    await Promise.all([
      writeFile(javascriptOutputPath, javascript),
      writeFile(typesOutputPath, types),
    ]);
  }

  return {
    changed,
    keyframeCount: keyframes.length,
    tokenCount: groups.reduce((count, group) => count + group.tokens.length, 0),
  };
};

const isMainModule = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMainModule) {
  const check = process.argv.includes("--check");
  const result = await generateTokens({ check });
  if (check && result.changed) {
    console.error("Regenerate Tailwind tokens with nr generate.");
    process.exitCode = 1;
  } else {
    const status = result.changed ? "Generated" : "Verified";
    console.log(`${status} ${result.tokenCount} tokens & ${result.keyframeCount} keyframes.`);
  }
}
