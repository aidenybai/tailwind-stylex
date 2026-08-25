const renderTokenGroup = (group: ThemeTokenGroup) => {
  const tokenLines = group.tokens.map((token) => `  ${token.key}: ${JSON.stringify(token.value)},`);
  return `export const ${group.exportName} = stylex.defineConsts({\n${tokenLines.join("\n")}\n});`;
};

const renderUtility = (utility: CompiledUtility) => {
  const declarationLines = Array.from(
    utility.declarations,
    ([property, value]) => `    ${property}: ${JSON.stringify(value)},`,
  );
  return `  ${utility.identifier}: {\n${declarationLines.join("\n")}\n  },`;
};

export const renderStyleXModule = (groups: ThemeTokenGroup[], utilities: CompiledUtility[]) => {
  const tokenSource = groups.map(renderTokenGroup).join("\n\n");
  const utilitySource = utilities.map(renderUtility).join("\n");
  return `import * as stylex from "@stylexjs/stylex";\n\n${tokenSource}\n\nexport const tw = stylex.create({\n${utilitySource}\n});\n`;
};
