interface ResolvedStyleXTailwindConfig {
  content: string[];
  identifier: string;
  input?: string;
  output: string;
  projectRoot: string;
  safelist: string[];
}

interface TailwindAstNode {
  important?: boolean;
  kind: string;
  name?: string;
  nodes?: TailwindAstNode[];
  params?: string;
  property?: string;
  selector?: string;
  value?: string;
}

interface CompiledUtility {
  declarations: Map<string, string | number>;
  identifier: string;
}

interface ThemeToken {
  key: string;
  value: string;
}

interface ThemeTokenGroup {
  exportName: string;
  tokens: ThemeToken[];
}

interface ThemeCompilation {
  groups: ThemeTokenGroup[];
  themeVariables: Map<string, string>;
  tokenCount: number;
}

interface CandidateIndex {
  ambiguousIdentifiers: Set<string>;
  candidatesByIdentifier: Map<string, string>;
  identifiersByCandidate: Map<string, string>;
}

interface CliOptions {
  check: boolean;
  configPath?: string;
}

declare const process: NodeJS.Process & {
  env: NodeJS.ProcessEnv & {
    VERSION?: string;
  };
};
