import assert from "node:assert/strict";
import test from "node:test";

import { buildResumeRtf } from "../src/lib/profile/exportRtf.ts";
import { ResumeEnhancementRequestSchema } from "../src/lib/validation/profile.ts";

test("buildResumeRtf escapes control characters", () => {
  const output = buildResumeRtf({
    candidateName: "Jane {Doe}",
    resumeText: "Built \\ shipped platform\nImproved conversion by [insert metric]",
  });

  assert.equal(output.includes("\\{Doe\\}"), true);
  assert.equal(output.includes("\\\\ shipped"), true);
  assert.equal(output.includes("\\line "), true);
});

test("ResumeEnhancementRequestSchema validates minimum resume length", () => {
  const parsed = ResumeEnhancementRequestSchema.safeParse({
    rawResumeText: "too short",
  });

  assert.equal(parsed.success, false);
});
