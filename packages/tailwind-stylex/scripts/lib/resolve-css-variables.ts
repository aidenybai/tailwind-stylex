import { findMatchingParenthesis } from "./find-matching-parenthesis.js";
import { splitCssVariableArguments } from "./split-css-variable-arguments.js";

export const resolveCssVariables = (
  value: string,
  variables: Map<string, string>,
  resolvingVariables = new Set<string>(),
): string | undefined => {
  let result = "";
  let searchIndex = 0;

  while (searchIndex < value.length) {
    const variableIndex = value.indexOf("var(", searchIndex);
    if (variableIndex === -1) {
      result += value.slice(searchIndex);
      break;
    }

    result += value.slice(searchIndex, variableIndex);
    const closingIndex = findMatchingParenthesis(value, variableIndex + 3);
    if (closingIndex === -1) return undefined;

    const variableExpression = value.slice(variableIndex + 4, closingIndex);
    const [variableName, fallback] = splitCssVariableArguments(variableExpression);
    const variableValue = variables.get(variableName);
    let replacement: string | undefined;

    if (variableValue !== undefined && !resolvingVariables.has(variableName)) {
      const nextResolvingVariables = new Set(resolvingVariables);
      nextResolvingVariables.add(variableName);
      replacement = resolveCssVariables(variableValue, variables, nextResolvingVariables);
    } else if (fallback !== undefined) {
      replacement = resolveCssVariables(fallback, variables, resolvingVariables);
    } else {
      replacement = value.slice(variableIndex, closingIndex + 1);
    }

    if (replacement === undefined) return undefined;
    result += replacement;
    searchIndex = closingIndex + 1;
  }

  return result.trim();
};
