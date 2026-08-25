import { candidateToIdentifier } from "./candidate-to-identifier.js";

export const getCandidateIndex = (
  classList: [string, { modifiers: string[] }][],
): CandidateIndex => {
  const candidatesByIdentifier = new Map<string, string>();
  const identifiersByCandidate = new Map<string, string>();
  const ambiguousIdentifiers = new Set<string>();

  const addCandidate = (candidate: string) => {
    const identifier = candidateToIdentifier(candidate);
    const existingCandidate = candidatesByIdentifier.get(identifier);

    if (existingCandidate && existingCandidate !== candidate) {
      ambiguousIdentifiers.add(identifier);
      return;
    }

    candidatesByIdentifier.set(identifier, candidate);
    identifiersByCandidate.set(candidate, identifier);
  };

  for (const [candidate, metadata] of classList) {
    addCandidate(candidate);
    for (const modifier of metadata.modifiers) addCandidate(`${candidate}/${modifier}`);
  }

  return { ambiguousIdentifiers, candidatesByIdentifier, identifiersByCandidate };
};
