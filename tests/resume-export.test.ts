import assert from "node:assert/strict";
import test from "node:test";

import { buildResumeDocxBuffer, resumeTextToStructuredLines } from "../src/lib/profile/exportDocx.ts";
import { ResumeEnhancementRequestSchema } from "../src/lib/validation/profile.ts";

test("resumeTextToStructuredLines maps headers and bullets", () => {
  const lines = resumeTextToStructuredLines("EXPERIENCE:\n- Built platform\nOwned roadmap");

  assert.deepEqual(lines, [
    { kind: "header", text: "EXPERIENCE" },
    { kind: "bullet", text: "Built platform" },
    { kind: "paragraph", text: "Owned roadmap" },
  ]);
});

test("buildResumeDocxBuffer returns a docx zip payload", async () => {
  const buffer = await buildResumeDocxBuffer({
    candidateName: "Jane Doe",
    resumeText: "EXPERIENCE:\n- Built platform",
  });

  assert.equal(buffer.length > 0, true);
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4b);
});

test("ResumeEnhancementRequestSchema validates minimum resume length", () => {
  const parsed = ResumeEnhancementRequestSchema.safeParse({
    rawResumeText: "too short",
  });

  assert.equal(parsed.success, false);
});
