"use client";

import { useEffect, useState, type FormEvent } from "react";

type Profile = {
  id?: number;
  name: string;
  headline: string;
  summary: string;
  skillsJson: string;
  voiceGuidelines: string;
};

const emptyProfile: Profile = {
  name: "",
  headline: "",
  summary: "",
  skillsJson: "[]",
  voiceGuidelines: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/profile");
      const payload = (await response.json()) as { profile?: Profile | null };
      if (payload.profile) {
        setProfile(payload.profile);
      }
    }

    void loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    setStatus(response.ok ? "Saved." : "Save failed.");
  }

  return (
    <main>
      <section className="card stack">
        <h1>Candidate Profile</h1>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </label>
          <label>
            Headline
            <input
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            />
          </label>
          <label>
            Summary
            <textarea
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
            />
          </label>
          <label>
            Skills JSON
            <textarea
              value={profile.skillsJson}
              onChange={(e) => setProfile({ ...profile, skillsJson: e.target.value })}
            />
          </label>
          <label>
            Voice Guidelines
            <textarea
              value={profile.voiceGuidelines}
              onChange={(e) => setProfile({ ...profile, voiceGuidelines: e.target.value })}
            />
          </label>
          <button type="submit">Save Profile</button>
        </form>
        <p className="small">{status}</p>
      </section>
    </main>
  );
}
