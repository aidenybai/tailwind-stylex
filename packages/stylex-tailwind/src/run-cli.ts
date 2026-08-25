import path from "node:path";

import { generate } from "./generate.js";

const HELP = `stylex-tailwind

Usage:
  stylex-tailwind generate [--check] [--config <path>]
  stylex-tailwind --help
  stylex-tailwind --version`;

const parseCliOptions = (arguments_: string[]): CliOptions => {
  const options: CliOptions = { check: false };

  for (let argumentIndex = 0; argumentIndex < arguments_.length; argumentIndex++) {
    const argument = arguments_[argumentIndex];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--config") {
      const configPath = arguments_[argumentIndex + 1];
      if (!configPath) throw new Error("Pass a path after --config.");
      options.configPath = configPath;
      argumentIndex++;
      continue;
    }
    throw new Error(`Unknown argument ${argument}.`);
  }

  return options;
};

export const runCli = async (arguments_: string[]) => {
  try {
    if (arguments_.includes("--help") || arguments_.includes("-h")) {
      console.log(HELP);
      return;
    }
    if (arguments_.includes("--version") || arguments_.includes("-v")) {
      console.log(process.env.VERSION ?? "0.0.0");
      return;
    }

    const [command = "generate", ...commandArguments] = arguments_;
    if (command !== "generate") throw new Error(`Unknown command ${command}.`);
    const cliOptions = parseCliOptions(commandArguments);
    const result = await generate({
      check: cliOptions.check,
      configPath: cliOptions.configPath,
    });
    const relativeOutputPath = path.relative(process.cwd(), result.outputPath);

    if (cliOptions.check && result.changed) {
      console.error(`Regenerate ${relativeOutputPath} with stylex-tailwind generate.`);
      process.exitCode = 1;
      return;
    }

    const status = result.changed ? "Generated" : "Verified";
    console.log(
      `${status} ${result.tokenCount} tokens & ${result.utilityCount} utilities in ${relativeOutputPath}.`,
    );
    if (result.unsupportedCandidates.length > 0) {
      console.warn(`Skipped: ${result.unsupportedCandidates.join(", ")}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
};
