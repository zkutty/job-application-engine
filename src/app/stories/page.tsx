"use client";

import { useEffect, useState, type FormEvent } from "react";

type Story = {
  id: number;
  title: string;
  situation: string;
  action: string;
  result: string;
  tagsJson: string;
};

type StoryDraft = Omit<Story, "id">;

const emptyDraft: StoryDraft = {
  title: "",
  situation: "",
  action: "",
  result: "",
  tagsJson: "[]",
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [draft, setDraft] = useState<StoryDraft>(emptyDraft);

  async function loadStories() {
    const response = await fetch("/api/stories");
    const payload = (await response.json()) as { stories?: Story[] };
    setStories(payload.stories ?? []);
  }

  useEffect(() => {
    void loadStories();
  }, []);

  async function createStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (response.ok) {
      setDraft(emptyDraft);
      await loadStories();
    }
  }

  async function updateStory(story: Story) {
    await fetch(`/api/stories/${story.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(story),
    });

    await loadStories();
  }

  async function deleteStory(id: number) {
    await fetch(`/api/stories/${id}`, { method: "DELETE" });
    await loadStories();
  }

  return (
    <main>
      <section className="card stack">
        <h1>HireSage Story Bank</h1>
        <form className="stack" onSubmit={createStory}>
          <label>
            Title
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label>
            Situation
            <textarea
              value={draft.situation}
              onChange={(e) => setDraft({ ...draft, situation: e.target.value })}
            />
          </label>
          <label>
            Action
            <textarea value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
          </label>
          <label>
            Result
            <textarea value={draft.result} onChange={(e) => setDraft({ ...draft, result: e.target.value })} />
          </label>
          <label>
            Tags JSON
            <input value={draft.tagsJson} onChange={(e) => setDraft({ ...draft, tagsJson: e.target.value })} />
          </label>
          <button type="submit">Add Story</button>
        </form>
      </section>

      <section className="card stack">
        <h2>Existing Stories</h2>
        {stories.length === 0 ? (
          <p className="small">No stories saved yet.</p>
        ) : (
          stories.map((story) => (
            <div key={story.id} className="card stack">
              <label>
                Title
                <input
                  value={story.title}
                  onChange={(e) =>
                    setStories((prev) =>
                      prev.map((s) => (s.id === story.id ? { ...s, title: e.target.value } : s)),
                    )
                  }
                />
              </label>
              <label>
                Situation
                <textarea
                  value={story.situation}
                  onChange={(e) =>
                    setStories((prev) =>
                      prev.map((s) => (s.id === story.id ? { ...s, situation: e.target.value } : s)),
                    )
                  }
                />
              </label>
              <label>
                Action
                <textarea
                  value={story.action}
                  onChange={(e) =>
                    setStories((prev) =>
                      prev.map((s) => (s.id === story.id ? { ...s, action: e.target.value } : s)),
                    )
                  }
                />
              </label>
              <label>
                Result
                <textarea
                  value={story.result}
                  onChange={(e) =>
                    setStories((prev) =>
                      prev.map((s) => (s.id === story.id ? { ...s, result: e.target.value } : s)),
                    )
                  }
                />
              </label>
              <label>
                Tags JSON
                <input
                  value={story.tagsJson}
                  onChange={(e) =>
                    setStories((prev) =>
                      prev.map((s) => (s.id === story.id ? { ...s, tagsJson: e.target.value } : s)),
                    )
                  }
                />
              </label>
              <div className="buttonRow">
                <button type="button" onClick={() => void updateStory(story)}>
                  Save
                </button>
                <button type="button" onClick={() => void deleteStory(story.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
