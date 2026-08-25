import { resolveCssVariables } from "./resolve-css-variables.js";
import { toStyleXProperty } from "./to-stylex-property.js";

const UNSUPPORTED_PROPERTIES = new Set(["animation", "animation-name"]);

const getPropertyInitialValues = (astNodes: TailwindAstNode[]) => {
  const initialValues = new Map<string, string>();

  for (const astNode of astNodes) {
    if (astNode.kind !== "at-rule" || astNode.name !== "@property" || !astNode.params) continue;
    const initialValue = astNode.nodes?.find(
      (innerNode) => innerNode.kind === "declaration" && innerNode.property === "initial-value",
    )?.value;
    if (initialValue !== undefined) initialValues.set(astNode.params, initialValue);
  }

  return initialValues;
};

export const compileUtility = (
  identifier: string,
  astNodes: TailwindAstNode[],
  themeVariables: Map<string, string>,
): CompiledUtility | undefined => {
  const rootRules = astNodes.filter((astNode) => astNode.kind === "rule");
  if (rootRules.length !== 1) return undefined;
  if (
    astNodes.some(
      (astNode) =>
        astNode.kind !== "rule" &&
        astNode.kind !== "comment" &&
        !(astNode.kind === "at-rule" && astNode.name === "@property"),
    )
  ) {
    return undefined;
  }

  const rootRule = rootRules[0];
  if (!rootRule.selector || /[\s>+~:,]/.test(rootRule.selector)) return undefined;
  if (!rootRule.nodes?.every((astNode) => astNode.kind === "declaration")) return undefined;
  if (rootRule.nodes.some((astNode) => astNode.important)) return undefined;

  const variables = new Map(themeVariables);
  for (const [variableName, initialValue] of getPropertyInitialValues(astNodes)) {
    variables.set(variableName, initialValue);
  }
  for (const declaration of rootRule.nodes) {
    if (declaration.property?.startsWith("--") && declaration.value !== undefined) {
      variables.set(declaration.property, declaration.value);
    }
  }

  const declarations = new Map<string, string | number>();
  for (const declaration of rootRule.nodes) {
    if (!declaration.property || declaration.property.startsWith("--")) continue;
    if (UNSUPPORTED_PROPERTIES.has(declaration.property) || declaration.value === undefined) {
      return undefined;
    }

    const resolvedValue = resolveCssVariables(declaration.value, variables);
    if (resolvedValue === undefined) return undefined;
    declarations.set(toStyleXProperty(declaration.property), resolvedValue);
  }

  if (declarations.size === 0) return undefined;
  return { declarations, identifier };
};
