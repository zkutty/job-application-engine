"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

type ImportedProfile = {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  voiceGuidelines: string;
  metricsInventory: string[];
};

const emptyImportedProfile: ImportedProfile = {
  name: "",
  headline: "",
  summary: "",
  skills: [],
  voiceGuidelines: "",
  metricsInventory: [],
};

export default function ProfileImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importedProfile, setImportedProfile] = useState<ImportedProfile>(emptyImportedProfile);
  const [rawResumeText, setRawResumeText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("Select a PDF first.");
      return;
    }

    setLoading(true);
    setStatus("Importing resume...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/import/resume", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        parsedProfile?: ImportedProfile;
        rawResumeText?: string;
        error?: string;
      };

      if (!response.ok || !payload.parsedProfile || !payload.rawResumeText) {
        throw new Error(payload.error ?? "Failed to import resume.");
      }

      setImportedProfile(payload.parsedProfile);
      setRawResumeText(payload.rawResumeText);
      setStatus("Imported. Review and save.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to import resume.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setStatus("Saving profile...");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: importedProfile.name,
          headline: importedProfile.headline,
          summary: importedProfile.summary,
          skillsJson: JSON.stringify(importedProfile.skills),
          voiceGuidelines: importedProfile.voiceGuidelines,
          profileJson: JSON.stringify(importedProfile),
          rawResumeText,
        }),
      });

      if (!response.ok) {
        throw new Error("Profile save failed.");
      }

      setStatus("Profile saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="card stack">
        <h1>Import Profile from Resume</h1>
        <form onSubmit={handleImport} className="stack">
          <input type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
          <button type="submit" disabled={loading}>
            {loading ? "Importing..." : "Import Resume PDF"}
          </button>
        </form>
        <p className="small">{status}</p>
      </section>

      <section className="card stack">
        <h2>Review Imported Profile</h2>
        <label>
          Name
          <input
            value={importedProfile.name}
            onChange={(e) => setImportedProfile({ ...importedProfile, name: e.target.value })}
          />
        </label>
        <label>
          Headline
          <input
            value={importedProfile.headline}
            onChange={(e) => setImportedProfile({ ...importedProfile, headline: e.target.value })}
          />
        </label>
        <label>
          Summary
          <textarea
            value={importedProfile.summary}
            onChange={(e) => setImportedProfile({ ...importedProfile, summary: e.target.value })}
          />
        </label>
        <label>
          Skills (JSON)
          <textarea
            value={JSON.stringify(importedProfile.skills, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value) as string[];
                setImportedProfile({ ...importedProfile, skills: parsed });
              } catch {
                // Ignore while user edits JSON.
              }
            }}
          />
        </label>
        <label>
          Voice Guidelines
          <textarea
            value={importedProfile.voiceGuidelines}
            onChange={(e) => setImportedProfile({ ...importedProfile, voiceGuidelines: e.target.value })}
          />
        </label>
        <label>
          Metrics Inventory (JSON)
          <textarea
            value={JSON.stringify(importedProfile.metricsInventory, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value) as string[];
                setImportedProfile({ ...importedProfile, metricsInventory: parsed });
              } catch {
                // Ignore while user edits JSON.
              }
            }}
          />
        </label>
        <button type="button" disabled={loading} onClick={() => void handleSave()}>
          Save Final Profile
        </button>
      </section>
    </main>
  );
}
