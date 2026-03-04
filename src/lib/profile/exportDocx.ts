import { Document, Packer, Paragraph, TextRun } from "docx";

type ResumeLine =
  | { kind: "header"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "paragraph"; text: string };

function isHeader(line: string): boolean {
  return line.endsWith(":") || /^[A-Z][A-Z\s/&-]{2,}$/.test(line);
}

export function resumeTextToStructuredLines(resumeText: string): ResumeLine[] {
  return resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
      if (bulletMatch) {
        return { kind: "bullet", text: bulletMatch[1].trim() } satisfies ResumeLine;
      }

      if (isHeader(line)) {
        return {
          kind: "header",
          text: line.endsWith(":") ? line.slice(0, -1).trim() : line,
        } satisfies ResumeLine;
      }

      return { kind: "paragraph", text: line } satisfies ResumeLine;
    });
}

function toParagraphs(lines: ResumeLine[]): Paragraph[] {
  return lines.map((line) => {
    if (line.kind === "header") {
      return new Paragraph({
        spacing: { before: 180, after: 60 },
        border: { bottom: { color: "B8C0CC", size: 8, space: 1, style: "single" } },
        children: [
          new TextRun({
            text: line.text.toUpperCase(),
            bold: true,
            font: "Cambria",
            size: 22,
          }),
        ],
      });
    }

    if (line.kind === "bullet") {
      return new Paragraph({
        text: line.text,
        bullet: { level: 0 },
        spacing: { before: 0, after: 50, line: 276 },
      });
    }

    return new Paragraph({
      text: line.text,
      spacing: { before: 0, after: 50, line: 276 },
    });
  });
}

export async function buildResumeDocxBuffer(input: {
  candidateName: string;
  resumeText: string;
}): Promise<Buffer> {
  const contentParagraphs = toParagraphs(resumeTextToStructuredLines(input.resumeText));
  const name = input.candidateName.trim() || "Candidate";

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 90 },
            children: [
              new TextRun({
                text: name,
                font: "Cambria",
                size: 32,
                bold: true,
              }),
            ],
          }),
          ...contentParagraphs,
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(document));
}
