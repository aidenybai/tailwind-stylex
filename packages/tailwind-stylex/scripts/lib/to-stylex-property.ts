export const toStyleXProperty = (property: string) => {
  const withoutVendorPrefix = property.replace(/^-webkit-/, "Webkit-").replace(/^-moz-/, "Moz-");
  return withoutVendorPrefix.replace(/-([a-z])/g, (_match, character: string) =>
    character.toUpperCase(),
  );
};
