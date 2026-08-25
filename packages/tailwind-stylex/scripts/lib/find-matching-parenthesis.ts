export const findMatchingParenthesis = (value: string, openingIndex: number) => {
  let depth = 0;

  for (let characterIndex = openingIndex; characterIndex < value.length; characterIndex++) {
    const character = value[characterIndex];
    if (character === "(") depth++;
    if (character === ")") depth--;
    if (depth === 0) return characterIndex;
  }

  return -1;
};
