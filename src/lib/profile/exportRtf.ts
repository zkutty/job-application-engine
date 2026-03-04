function escapeRtf(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\n/g, "\\line ");
}

export function buildResumeRtf(input: { candidateName: string; resumeText: string }): string {
  const title = `${input.candidateName || "Candidate"} Resume`;

  return [
    "{\\rtf1\\ansi\\deff0",
    "{\\fonttbl{\\f0 Arial;}}",
    "\\fs24",
    `\\b ${escapeRtf(title)} \\b0\\par`,
    "\\par",
    escapeRtf(input.resumeText),
    "}",
  ].join("\n");
}
