import assert from "node:assert/strict";
import test from "node:test";

import { buildCoverLetterMessages } from "../src/lib/prompts/coverLetter.ts";

test("buildCoverLetterMessages includes retry instructions when retryContext is provided", () => {
  const messages = buildCoverLetterMessages({
    jobDescription: "Seeking a product marketing manager.",
    retryContext: {
      attemptNumber: 2,
      previousWordCount: 233,
      minWords: 250,
      maxWords: 350,
    },
  });

  assert.equal(messages.length, 3);
  assert.equal(messages[2]?.role, "user");
  assert.equal(
    typeof messages[2]?.content === "string" && messages[2].content.includes("previous draft was 233 words"),
    true,
  );
  assert.equal(
    typeof messages[2]?.content === "string" &&
      messages[2].content.includes("Rewrite to be between 250 and 350 words"),
    true,
  );
});
