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

const defaultVoiceGuidelines =
  "Use concise, specific language grounded in the resume. Do not add unsupported metrics.";

export default function ProfileImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [importedProfile, setImportedProfile] = useState<ImportedProfile>(emptyImportedProfile);
  const [rawResumeText, setRawResumeText] = useState("");
  const [rewrittenResume, setRewrittenResume] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
      setRewrittenResume(payload.rawResumeText);
      setSuggestions([]);
      setStatus("Imported. Review and save.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to import resume.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const voiceGuidelines = importedProfile.voiceGuidelines.trim() || defaultVoiceGuidelines;

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
          voiceGuidelines,
          profileJson: JSON.stringify(importedProfile),
          rawResumeText: rewrittenResume || rawResumeText,
        }),
      });

      if (!response.ok) {
        throw new Error("Profile save failed.");
      }

      if (voiceGuidelines !== importedProfile.voiceGuidelines) {
        setImportedProfile({ ...importedProfile, voiceGuidelines });
      }
      setStatus("Profile saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnhanceResume() {
    if (!rawResumeText) {
      setStatus("Import a PDF before running AI edits.");
      return;
    }

    setLoading(true);
    setStatus("Generating edit suggestions and rewritten resume...");

    try {
      const response = await fetch("/api/profile/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawResumeText: rewrittenResume || rawResumeText,
          targetRole: targetRole || undefined,
        }),
      });

      const payload = (await response.json()) as {
        suggestions?: string[];
        rewrittenResume?: string;
        parsedProfile?: ImportedProfile;
        error?: string;
      };

      if (!response.ok || !payload.rewrittenResume || !payload.parsedProfile || !payload.suggestions) {
        throw new Error(payload.error ?? "Failed to enhance resume.");
      }

      setSuggestions(payload.suggestions);
      setRewrittenResume(payload.rewrittenResume);
      setImportedProfile(payload.parsedProfile);
      setStatus("Resume updated with AI suggestions.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to enhance resume.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadRtf() {
    const resumeText = rewrittenResume || rawResumeText;
    if (!resumeText) {
      setStatus("No resume text available to export.");
      return;
    }

    setLoading(true);
    setStatus("Preparing resume export...");

    try {
      const response = await fetch("/api/profile/resume/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: importedProfile.name || "Candidate",
          resumeText,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to export resume.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(importedProfile.name || "candidate").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-resume.rtf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatus("Downloaded .rtf. Upload it to Google Drive and open with Google Docs.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to export resume.");
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
          <label>
            Target Role (optional)
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Product Manager"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Importing..." : "Import Resume PDF"}
          </button>
          <button type="button" disabled={loading} onClick={() => void handleEnhanceResume()}>
            Run AI Resume Edits
          </button>
          <button type="button" disabled={loading} onClick={() => void handleDownloadRtf()}>
            Download for Google Docs (.rtf)
          </button>
        </form>
        <p className="small">{status}</p>
      </section>

      <section className="card stack">
        <h2>AI Edit Suggestions</h2>
        {suggestions.length ? (
          <ul className="stack">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        ) : (
          <p className="small">Run AI edits to generate improvement suggestions.</p>
        )}
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

      <section className="card stack">
        <h2>Rewritten Resume Text</h2>
        <textarea
          value={rewrittenResume}
          onChange={(e) => setRewrittenResume(e.target.value)}
          placeholder="AI rewritten resume will appear here."
        />
      </section>
    </main>
  );
}
