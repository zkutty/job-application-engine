import assert from "node:assert/strict";
import test from "node:test";

import { buildResumeHtml } from "../src/lib/profile/exportHtml.ts";
import { ResumeEnhancementRequestSchema } from "../src/lib/validation/profile.ts";

test("buildResumeHtml escapes HTML special characters", () => {
  const output = buildResumeHtml({
    candidateName: "Jane {Doe}",
    resumeText: "EXPERIENCE:\n- Built <platform> & shipped",
  });

  assert.equal(output.includes("Jane {Doe} Resume"), true);
  assert.equal(output.includes("&lt;platform&gt; &amp; shipped"), true);
  assert.equal(output.includes("<h2>EXPERIENCE</h2>"), true);
});

test("ResumeEnhancementRequestSchema validates minimum resume length", () => {
  const parsed = ResumeEnhancementRequestSchema.safeParse({
    rawResumeText: "too short",
  });

  assert.equal(parsed.success, false);
});
