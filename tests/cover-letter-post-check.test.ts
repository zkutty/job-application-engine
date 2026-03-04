import assert from "node:assert/strict";
import test from "node:test";

import { postCheckCoverLetter } from "../src/lib/safety/coverLetter.ts";

test("postCheckCoverLetter keeps allowed numbers and replaces unknown metrics", () => {
  const result = postCheckCoverLetter({
    coverLetter: "I improved retention by 27% and reduced CPA by 18% in 2024.",
    sourceTexts: ["Role requires ownership of 27% retention goal in 2024."],
    minWords: 1,
    maxWords: 50,
  });

  assert.equal(result.withinWordRange, true);
  assert.equal(result.sanitizedCoverLetter.includes("27%"), true);
  assert.equal(result.sanitizedCoverLetter.includes("2024"), true);
  assert.equal(result.sanitizedCoverLetter.includes("18%"), false);
  assert.equal(result.sanitizedCoverLetter.includes("[insert metric]"), true);
});

test("postCheckCoverLetter flags out-of-range word counts", () => {
  const result = postCheckCoverLetter({
    coverLetter: "Short letter only.",
    sourceTexts: ["Short letter only."],
    minWords: 10,
    maxWords: 20,
  });

  assert.equal(result.withinWordRange, false);
  assert.equal(result.wordCount, 3);
});
