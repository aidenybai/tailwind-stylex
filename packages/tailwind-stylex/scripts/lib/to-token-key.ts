export const toTokenKey = (value: string) => {
  const segments = value.split("-").filter(Boolean);
  return segments.reduce((result, segment, segmentIndex) => {
    if (segmentIndex === 0 || /^\d/.test(segment)) return `${result}${segment}`;
    return `${result}${segment[0].toUpperCase()}${segment.slice(1)}`;
  }, "");
};
