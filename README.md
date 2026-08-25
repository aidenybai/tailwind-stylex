# stylex-tailwind

A compile-time bridge from Tailwind CSS to StyleX.

`stylex-tailwind` reads Tailwind’s installed design system, scans your source for the utilities you use, and generates a static `.stylex.ts` module. Tailwind remains the source of truth for tokens and utility behavior.

## Install

```shell
pnpm add -D @aidenybai/stylex-tailwind tailwindcss
pnpm add @stylexjs/stylex
```

## Configure

Create `stylex-tailwind.config.ts`:

```typescript
import { defineConfig } from "@aidenybai/stylex-tailwind";

export default defineConfig({
  content: ["src/**/*.{ts,tsx}"],
  input: "src/app/theme.css",
  output: "src/styles/tailwind.stylex.ts",
});
```

Your Tailwind entry can use the standard Tailwind theme:

```css
@import "tailwindcss/theme.css";
@tailwind utilities;

@theme {
  --color-brand-500: oklch(62% 0.2 250);
}
```

Generate the StyleX module:

```shell
stylex-tailwind generate
```

Add the command before your build and type-check scripts.

## Use

```tsx
import * as stylex from "@stylexjs/stylex";

import { color, tw } from "@/styles/tailwind.stylex";

const Card = () => (
  <article {...stylex.props(tw.flex, tw.itemsCenter, tw.gap4, tw.p4, tw.roundedLg)}>
    <span {...stylex.props(tw.textSm, tw.fontMedium, tw.textBrand500)}>Hello</span>
  </article>
);

const styles = stylex.create({
  custom: {
    backgroundColor: color.brand500,
  },
});
```

Use `stylex-tailwind generate --check` in CI to verify that generated output is current.

## How It Works

1. Tailwind exposes its theme and utility candidates through its compiler API.
2. The scanner maps `tw.camelCasedName` access back to the matching Tailwind class.
3. Tailwind compiles each used candidate.
4. The bridge resolves Tailwind’s internal custom properties and emits StyleX declarations.
5. StyleX performs its normal static extraction during your application build.

The generator emits only utilities referenced by your source or listed in `safelist`. It skips selectors and behaviors that StyleX cannot represent as a local style object.

## License

MIT
