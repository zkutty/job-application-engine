const NUMBER_PATTERN = /\b\d[\d,.%]*\b/g;

function collectNumberTokens(text: string): Set<string> {
  const matches = text.match(NUMBER_PATTERN) ?? [];
  return new Set(matches);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type PostCheckInput = {
  coverLetter: string;
  sourceTexts: string[];
  minWords?: number;
  maxWords?: number;
};

type PostCheckResult = {
  sanitizedCoverLetter: string;
  wordCount: number;
  withinWordRange: boolean;
};

export function postCheckCoverLetter(input: PostCheckInput): PostCheckResult {
  const allowedNumbers = collectNumberTokens(input.sourceTexts.join("\n"));

  const sanitizedCoverLetter = input.coverLetter.replace(NUMBER_PATTERN, (token) => {
    return allowedNumbers.has(token) ? token : "[insert metric]";
  });

  const wordCount = countWords(sanitizedCoverLetter);
  const minWords = input.minWords ?? 250;
  const maxWords = input.maxWords ?? 350;

  return {
    sanitizedCoverLetter,
    wordCount,
    withinWordRange: wordCount >= minWords && wordCount <= maxWords,
  };
}
