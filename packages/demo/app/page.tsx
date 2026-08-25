import * as stylex from "@stylexjs/stylex";
import { animations, colors, mediaQueries, radii, spacing } from "tailwind-stylex/tokens.stylex";

const styles = stylex.create({
  card: {
    animation: animations.pulse,
    backgroundColor: colors.stone100,
    borderColor: colors.stone300,
    borderRadius: radii.full,
    borderStyle: "solid",
    borderWidth: spacing.px,
    color: {
      default: colors.stone900,
      [mediaQueries.md]: colors.current,
    },
    padding: spacing[8],
  },
  main: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minHeight: "100dvh",
    padding: spacing[4],
  },
});

const Home = () => (
  <main {...stylex.props(styles.main)}>
    <h1 {...stylex.props(styles.card)}>Tailwind Tokens, Compiled By StyleX</h1>
  </main>
);

export default Home;
