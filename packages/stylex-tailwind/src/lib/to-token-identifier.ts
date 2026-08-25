export const toTokenIdentifier = (segments: string[]) => {
  const identifier = segments.reduce((result, segment, segmentIndex) => {
    const normalizedSegment = segment.replace(/[^A-Za-z0-9_$]/g, "_");
    if (!normalizedSegment) return result;
    if (segmentIndex === 0 || /^\d/.test(normalizedSegment)) {
      return `${result}${normalizedSegment}`;
    }
    return `${result}${normalizedSegment[0].toUpperCase()}${normalizedSegment.slice(1)}`;
  }, "");

  if (!identifier) return "default";
  if (/^[A-Za-z_$]/.test(identifier)) return identifier;
  return `token${identifier[0].toUpperCase()}${identifier.slice(1)}`;
};
