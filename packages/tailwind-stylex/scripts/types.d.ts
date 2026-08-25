interface CompiledTokenCandidate {
  candidate: string;
  exportName: string;
  key: string;
  property: string;
}

interface GeneratedToken {
  key: string;
  value: string;
}

interface GeneratedTokenGroup {
  exportName: string;
  tokens: GeneratedToken[];
}

interface GeneratedKeyframeStep {
  declarations: Map<string, string>;
  selector: string;
}

interface GeneratedKeyframe {
  name: string;
  steps: GeneratedKeyframeStep[];
}

interface GenerateTokensOptions {
  check?: boolean;
}

interface GenerateTokensResult {
  changed: boolean;
  keyframeCount: number;
  tokenCount: number;
}
