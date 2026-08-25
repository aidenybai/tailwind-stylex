# tailwind-stylex

Use Tailwind’s default design tokens directly in StyleX. Get typed, autocomplete-friendly constants with no package-specific config, scanning, or generation.

## Install

```shell
pnpm add tailwind-stylex @stylexjs/stylex
```

Configure your StyleX compiler to process `tailwind-stylex`. Skip this step if your integration already processes direct dependencies.

With `@stylexjs/unplugin`:

```typescript
stylex({
  externalPackages: ["tailwind-stylex"],
});
```

With `@stylexjs/postcss-plugin`, add the token module when you set a custom `include` list:

```javascript
{
  include: [
    "src/**/*.{js,jsx,ts,tsx}",
    "node_modules/tailwind-stylex/tokens.stylex.js",
  ],
}
```

## Use

Import the tokens you need and use them in `stylex.create`:

```tsx
import * as stylex from "@stylexjs/stylex";
import { colors, containers, fontSizes, radii, spacing } from "tailwind-stylex/tokens.stylex";

const styles = stylex.create({
  card: {
    backgroundColor: colors.stone100,
    borderRadius: radii.lg,
    color: colors.stone900,
    padding: spacing[4],
  },
});
```

Use bracket notation for numeric Tailwind names:

```tsx
const styles = stylex.create({
  hero: {
    fontSize: fontSizes["2xl"],
    maxWidth: containers["7xl"],
    padding: spacing[8],
  },
});
```

## Available Tokens

| Category   | Exports                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------ |
| Colors     | `colors`                                                                                   |
| Layout     | `spacing`, `breakpoints`, `mediaQueries`, `containers`, `aspectRatios`, `maxWidths`        |
| Typography | `fonts`, `fontSizes`, `fontSizeLineHeights`, `fontWeights`, `letterSpacing`, `lineHeights` |
| Surfaces   | `radii`, `shadows`, `insetShadows`, `dropShadows`, `textShadows`, `blurs`                  |
| Motion     | `easings`, `animations`, `perspectives`                                                    |
| Defaults   | `defaults`                                                                                 |

Your editor autocompletes every token and shows its exact value.

## License

MIT
