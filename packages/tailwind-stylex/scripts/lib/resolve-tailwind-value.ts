import { resolveCssVariables } from "./resolve-css-variables.js";

const THEME_FUNCTION_PATTERN = /--theme\((--[\w-]+),\s*([^)]+)\)/g;

export const resolveTailwindValue = (value: string, variables: Map<string, string>) => {
  const resolvedThemeFunctions = value.replace(
    THEME_FUNCTION_PATTERN,
    (_match, variableName: string, fallback: string) => variables.get(variableName) ?? fallback,
  );
  const resolvedValue = resolveCssVariables(resolvedThemeFunctions, variables);
  return resolvedValue?.replace(/\s+/g, " ").trim();
};
