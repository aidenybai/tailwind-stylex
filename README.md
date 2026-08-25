# tailwind-stylex

Tailwind CSS design tokens for StyleX, generated directly from Tailwind’s default theme.

`tailwind-stylex` parses the installed `tailwindcss/theme.css` with Lightning CSS once when this package updates. It publishes the resulting static StyleX constants. Your app does not need a package-specific config file, scanner, Tailwind compiler, or generation step.

## Install

```shell
pnpm add tailwind-stylex @stylexjs/stylex
```

## Use

```tsx
import * as stylex from "@stylexjs/stylex";
import { colors, radii, spacing } from "tailwind-stylex/tokens.stylex";

const styles = stylex.create({
  card: {
    backgroundColor: colors.stone100,
    borderRadius: radii.lg,
    color: colors.stone900,
    padding: spacing[4],
  },
});
```

The package exports:

- `colors`
- `spacing`
- `breakpoints`
- `containers`
- `fonts`
- `fontSizes`
- `fontSizeLineHeights`
- `fontWeights`
- `letterSpacing`
- `lineHeights`
- `radii`
- `shadows`
- `insetShadows`
- `dropShadows`
- `textShadows`
- `easings`
- `animations`
- `blurs`
- `perspectives`
- `aspectRatios`
- `defaults`
- `maxWidths`

Token names follow Tailwind. Numeric names use bracket notation, such as `spacing[4]`, `breakpoints["2xl"]`, and `fontSizes["2xl"]`.

## StyleX Setup

Your StyleX compiler must process `tailwind-stylex` as a direct StyleX dependency. With `@stylexjs/unplugin`, add it to `externalPackages`:

```typescript
stylex({
  externalPackages: ["tailwind-stylex"],
});
```

`@stylexjs/postcss-plugin` discovers direct StyleX dependencies automatically. If you set a custom `include` list, include the generated module:

```javascript
{
  include: [
    "src/**/*.{js,jsx,ts,tsx}",
    "node_modules/tailwind-stylex/tokens.stylex.js",
  ],
}
```

## Updating Tailwind

Only package maintainers run:

```shell
nr generate
```

CI runs `nr build` to verify that the committed tokens match the installed Tailwind version.

## License

MIT
