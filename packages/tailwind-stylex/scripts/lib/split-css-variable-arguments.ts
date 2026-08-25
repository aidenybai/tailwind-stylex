export const splitCssVariableArguments = (value: string) => {
  let depth = 0;

  for (let characterIndex = 0; characterIndex < value.length; characterIndex++) {
    const character = value[characterIndex];
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (character === "," && depth === 0) {
      return [value.slice(0, characterIndex).trim(), value.slice(characterIndex + 1).trim()];
    }
  }

  return [value.trim()];
};
