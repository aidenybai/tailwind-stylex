import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const staticDirectory = path.resolve(import.meta.dirname, "../.next/static");

const getCssFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return getCssFiles(entryPath);
      return entry.name.endsWith(".css") ? [entryPath] : [];
    }),
  );
  return files.flat();
};

const cssFiles = await getCssFiles(staticDirectory);
const css = (await Promise.all(cssFiles.map((filePath) => readFile(filePath, "utf8")))).join("\n");

if (css.includes("var(--x")) throw new Error("StyleX left unresolved package token references.");
if (!css.includes("@media (min-width:48rem)")) throw new Error("StyleX omitted responsive tokens.");
if (!css.includes("color:currentColor")) throw new Error("StyleX omitted special color tokens.");
if (!css.includes("@keyframes")) throw new Error("StyleX omitted animation tokens.");
