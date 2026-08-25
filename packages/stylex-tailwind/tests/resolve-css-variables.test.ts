import { describe, expect, it } from "vitest";

import { resolveCssVariables } from "../src/lib/resolve-css-variables.js";

describe("resolveCssVariables", () => {
  it("resolves nested theme and Tailwind variables", () => {
    const variables = new Map([
      ["--spacing", "0.25rem"],
      ["--tw-shadow", "0 1px var(--tw-shadow-color, rgb(0 0 0 / 0.1))"],
    ]);

    expect(resolveCssVariables("calc(var(--spacing) * 4)", variables)).toBe("calc(0.25rem * 4)");
    expect(resolveCssVariables("var(--tw-shadow)", variables)).toBe("0 1px rgb(0 0 0 / 0.1)");
  });

  it("keeps user variables and rejects unresolved Tailwind variables", () => {
    expect(resolveCssVariables("var(--brand-color)", new Map())).toBe("var(--brand-color)");
    expect(resolveCssVariables("var(--tw-missing)", new Map())).toBeUndefined();
  });
});
