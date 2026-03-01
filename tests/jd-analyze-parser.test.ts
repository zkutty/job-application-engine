import assert from "node:assert/strict";
import test from "node:test";

import { JdAnalysisSchema } from "@/lib/jd/analyze";

test("JdAnalysisSchema parses valid analyzer output", () => {
  const parsed = JdAnalysisSchema.parse({
    roleTitleGuess: "Backend Engineer",
    seniorityGuess: "Mid-level",
    competencies: ["API design", "System design", "Debugging"],
    keywords: ["microservices", "scalability", "distributed systems"],
    tools: ["TypeScript", "Node.js", "PostgreSQL"],
  });

  assert.equal(parsed.roleTitleGuess, "Backend Engineer");
  assert.equal(parsed.competencies.length, 3);
});

test("JdAnalysisSchema rejects arrays over max size", () => {
  assert.throws(() =>
    JdAnalysisSchema.parse({
      roleTitleGuess: "Backend Engineer",
      seniorityGuess: "Mid-level",
      competencies: Array.from({ length: 9 }, (_, i) => `c${i}`),
      keywords: [],
      tools: [],
    }),
  );
});
