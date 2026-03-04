import assert from "node:assert/strict";
import test from "node:test";

import { extractJdTextFromHtml, looksLikeJobUrl } from "../src/lib/jd/resolveInput.ts";

test("looksLikeJobUrl accepts http(s) URLs and rejects plain text", () => {
  assert.equal(looksLikeJobUrl("https://www.linkedin.com/jobs/view/123"), true);
  assert.equal(looksLikeJobUrl("http://example.com/job"), true);
  assert.equal(looksLikeJobUrl("Senior Software Engineer role with TypeScript"), false);
});

test("extractJdTextFromHtml strips tags and keeps job-relevant text", () => {
  const html = `
    <html>
      <head>
        <title>Job</title>
        <style>.x { color: red; }</style>
        <script>window.ignore = true;</script>
      </head>
      <body>
        <section>
          <h1>Senior Backend Engineer</h1>
          <p>Build APIs and data pipelines.</p>
          <ul>
            <li>5+ years Node.js</li>
            <li>Experience with PostgreSQL</li>
          </ul>
        </section>
      </body>
    </html>
  `;

  const extracted = extractJdTextFromHtml(html);

  assert.equal(extracted.includes("Senior Backend Engineer"), true);
  assert.equal(extracted.includes("Build APIs and data pipelines."), true);
  assert.equal(extracted.includes("5+ years Node.js"), true);
  assert.equal(extracted.includes("window.ignore"), false);
  assert.equal(extracted.includes("color: red"), false);
});
