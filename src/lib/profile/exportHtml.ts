function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSectionHeader(line: string): boolean {
  return line.endsWith(":") || /^[A-Z][A-Z\s/&-]{2,}$/.test(line);
}

function toBodyHtml(resumeText: string): string {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: string[] = [];
  let openList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

    if (bulletMatch) {
      if (!openList) {
        blocks.push("<ul>");
        openList = true;
      }
      blocks.push(`<li>${escapeHtml(bulletMatch[1])}</li>`);
      continue;
    }

    if (openList) {
      blocks.push("</ul>");
      openList = false;
    }

    if (isSectionHeader(line)) {
      const header = line.endsWith(":") ? line.slice(0, -1) : line;
      blocks.push(`<h2>${escapeHtml(header)}</h2>`);
      continue;
    }

    blocks.push(`<p>${escapeHtml(line)}</p>`);
  }

  if (openList) {
    blocks.push("</ul>");
  }

  return blocks.join("\n");
}

export function buildResumeHtml(input: { candidateName: string; resumeText: string }): string {
  const title = escapeHtml(`${input.candidateName || "Candidate"} Resume`);
  const body = toBodyHtml(input.resumeText);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @page { size: Letter; margin: 0.5in; }
      body {
        margin: 0;
        background: #f4f6f8;
        color: #111827;
        font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      }
      .page {
        box-sizing: border-box;
        width: 8.5in;
        min-height: 11in;
        margin: 0.5rem auto;
        padding: 0.5in;
        background: white;
      }
      h1 {
        margin: 0 0 0.18in;
        font-size: 18pt;
      }
      h2 {
        margin: 0.14in 0 0.06in;
        font-size: 12pt;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 0.03in;
      }
      p, li {
        font-size: 11pt;
        line-height: 1.24;
        margin: 0 0 0.05in;
      }
      ul {
        margin: 0 0 0.09in 0.2in;
        padding: 0;
      }
      .hint {
        margin-top: 0.12in;
        color: #4b5563;
        font-size: 9.5pt;
        border-top: 1px dashed #d1d5db;
        padding-top: 0.08in;
      }
      @media print {
        body { background: white; }
        .page {
          width: auto;
          min-height: auto;
          margin: 0;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <article class="page">
      <h1>${title}</h1>
      ${body}
      <p class="hint">Targeted for one-page US letter layout (11pt body, compact spacing).</p>
    </article>
  </body>
</html>`;
}
