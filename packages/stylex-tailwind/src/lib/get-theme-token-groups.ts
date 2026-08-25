import { resolveCssVariables } from "./resolve-css-variables.js";
import { toTokenIdentifier } from "./to-token-identifier.js";

const getExportName = (namespace: string) => {
  const identifier = toTokenIdentifier([namespace]);
  return identifier === "default" ? "defaultTokens" : identifier;
};

export const getThemeTokenGroups = (
  entries: Iterable<[string, { value: string }]>,
): ThemeCompilation => {
  const themeVariables = new Map<string, string>();
  for (const [cssVariable, themeValue] of entries) {
    themeVariables.set(cssVariable, themeValue.value);
  }

  const groupsByExportName = new Map<string, ThemeTokenGroup>();
  const tokenKeysByExportName = new Map<string, Set<string>>();

  for (const [cssVariable, rawValue] of themeVariables) {
    const variableSegments = cssVariable.slice(2).split("-").filter(Boolean);
    const namespace = variableSegments.shift();
    if (!namespace) continue;

    const exportName = getExportName(namespace);
    const key = toTokenIdentifier(variableSegments);
    const value = resolveCssVariables(rawValue, themeVariables);
    if (value === undefined) continue;

    const existingKeys = tokenKeysByExportName.get(exportName) ?? new Set<string>();
    if (existingKeys.has(key)) {
      throw new Error(`Tailwind theme tokens collide at ${exportName}.${key}.`);
    }
    existingKeys.add(key);
    tokenKeysByExportName.set(exportName, existingKeys);

    const group = groupsByExportName.get(exportName) ?? { exportName, tokens: [] };
    group.tokens.push({ key, value });
    groupsByExportName.set(exportName, group);
  }

  const groups = Array.from(groupsByExportName.values()).sort((firstGroup, secondGroup) =>
    firstGroup.exportName.localeCompare(secondGroup.exportName),
  );
  return {
    groups,
    themeVariables,
    tokenCount: groups.reduce((count, group) => count + group.tokens.length, 0),
  };
};
