const normalizeIdentifierSegment = (segment: string) =>
  segment
    .replaceAll(".", "_")
    .replaceAll("/", "_")
    .replace(/[^A-Za-z0-9_$]/g, "_");

export const candidateToIdentifier = (candidate: string) => {
  const isNegative = candidate.startsWith("-");
  const candidateWithoutSign = isNegative ? candidate.slice(1) : candidate;
  const segments = candidateWithoutSign.split("-").map(normalizeIdentifierSegment).filter(Boolean);

  const identifier = segments.reduce(
    (result, segment, segmentIndex) => {
      if ((segmentIndex === 0 && !isNegative) || /^\d/.test(segment)) {
        return `${result}${segment}`;
      }
      return `${result}${segment[0].toUpperCase()}${segment.slice(1)}`;
    },
    isNegative ? "negative" : "",
  );

  if (/^[A-Za-z_$]/.test(identifier)) return identifier;
  return `utility${identifier[0]?.toUpperCase() ?? ""}${identifier.slice(1)}`;
};
