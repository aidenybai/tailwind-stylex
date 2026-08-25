import { describe, expect, it } from "vitest";

import { candidateToIdentifier } from "../src/lib/candidate-to-identifier.js";

const cases = [
  ["flex", "flex"],
  ["items-center", "itemsCenter"],
  ["p-0.5", "p0_5"],
  ["text-2xl", "text2xl"],
  ["w-1/2", "w1_2"],
  ["-mt-4", "negativeMt4"],
];

describe("candidateToIdentifier", () => {
  it.each(cases)("maps %s to %s", (candidate, identifier) => {
    expect(candidateToIdentifier(candidate)).toBe(identifier);
  });
});
