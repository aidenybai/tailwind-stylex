export interface StyleXTailwindConfig {
  content?: string[];
  identifier?: string;
  input?: string;
  output?: string;
  safelist?: string[];
}

export interface GenerateOptions {
  check?: boolean;
  config?: StyleXTailwindConfig;
  configPath?: string;
  cwd?: string;
}

export interface GenerateResult {
  changed: boolean;
  outputPath: string;
  tokenCount: number;
  unsupportedCandidates: string[];
  utilityCount: number;
}
