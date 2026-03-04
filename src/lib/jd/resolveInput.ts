const URL_PROTOCOLS = new Set(["http:", "https:"]);

function maybeUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return URL_PROTOCOLS.has(parsed.protocol) ? parsed : null;
  } catch {
    if (/\s/.test(trimmed) || !trimmed.includes(".")) {
      return null;
    }

    try {
      const parsed = new URL(`https://${trimmed}`);
      return URL_PROTOCOLS.has(parsed.protocol) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function extractJdTextFromHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const withBreaks = withoutScripts.replace(
    /<\/?(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6|br|tr|td|th)[^>]*>/gi,
    "\n",
  );

  const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(withoutTags);

  return decoded.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function extractJsonLdDescription(html: string): string {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];

  let longest = "";
  for (const script of scripts) {
    const content = script
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();
    if (!content) continue;

    try {
      const parsed = JSON.parse(content) as unknown;
      const queue = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of queue) {
        if (typeof item !== "object" || item === null) continue;
        const description = (item as { description?: unknown }).description;
        if (typeof description !== "string") continue;
        const cleaned = extractJdTextFromHtml(description);
        if (cleaned.length > longest.length) {
          longest = cleaned;
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return longest;
}

export function looksLikeJobUrl(input: string): boolean {
  return maybeUrl(input) !== null;
}

export async function resolveJobDescriptionInput(input: string): Promise<string> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please provide a job description or a job-posting URL.");
  }

  const parsedUrl = maybeUrl(trimmed);
  if (!parsedUrl) {
    if (trimmed.length < 40) {
      throw new Error("Please provide at least 40 characters of job description text.");
    }
    return trimmed;
  }

  let response: Response;
  try {
    response = await fetch(parsedUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not fetch that URL. Try pasting the JD text directly.");
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch the job posting URL (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const body = await response.text();
  const fromJsonLd = extractJsonLdDescription(body);
  const fromBody = contentType.includes("text/plain") ? body.trim() : extractJdTextFromHtml(body);
  const extracted = fromJsonLd.length > fromBody.length ? fromJsonLd : fromBody;

  if (extracted.length < 120) {
    throw new Error(
      "Could not extract enough job description text from that URL. Try pasting the JD text directly.",
    );
  }

  return extracted;
}
