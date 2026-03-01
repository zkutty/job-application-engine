export type StoryCandidate = {
  id: number;
  title: string;
  situation: string;
  action: string;
  result: string;
  tags: string[];
};

type SelectStoriesInput = {
  stories: StoryCandidate[];
  jdCompetencies: string[];
  jdKeywords: string[];
  limit?: number;
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function scoreStory(story: StoryCandidate, targets: string[]): number {
  const haystack = normalize(
    [story.title, story.situation, story.action, story.result, ...story.tags].join(" "),
  );

  return targets.reduce((score, target) => {
    const token = normalize(target);
    return token && haystack.includes(token) ? score + 1 : score;
  }, 0);
}

export function selectTopStories(input: SelectStoriesInput): StoryCandidate[] {
  const targets = [...input.jdCompetencies, ...input.jdKeywords].map(normalize).filter(Boolean);
  const limit = input.limit ?? 2;

  return [...input.stories]
    .map((story) => ({
      story,
      score: scoreStory(story, targets),
    }))
    .sort((a, b) => b.score - a.score || b.story.id - a.story.id)
    .slice(0, limit)
    .map((entry) => entry.story);
}
