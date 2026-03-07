"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Profile = {
  id?: number;
  name: string;
  headline: string;
  summary: string;
  skillsJson: string;
  voiceGuidelines: string;
  profileJson?: string;
  rawResumeText?: string;
};

const emptyProfile: Profile = {
  name: "",
  headline: "",
  summary: "",
  skillsJson: "[]",
  voiceGuidelines: "",
  profileJson: "",
  rawResumeText: "",
};

const defaultVoiceGuidelines =
  "Use concise, specific language grounded in the resume. Do not add unsupported metrics.";

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
    const voiceGuidelines = profile.voiceGuidelines.trim() || defaultVoiceGuidelines;

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...profile, voiceGuidelines }),
    });

    if (voiceGuidelines !== profile.voiceGuidelines) {
      setProfile({ ...profile, voiceGuidelines });
    }
    setStatus(response.ok ? "Saved." : "Save failed.");
  }

  return (
    <main>
      <section className="card stack">
        <h1>HireSage Candidate Profile</h1>
        <p className="small">
          You can also import from PDF at <Link href="/profile/import">/profile/import</Link>.
        </p>
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
