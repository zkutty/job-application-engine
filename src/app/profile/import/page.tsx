"use client";

import { useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

type ImportedProfile = {
  name: string;
  headline: string;
  summary: string;
  skills: string[];
  voiceGuidelines: string;
  metricsInventory: string[];
};

type TopFeedbackItem = {
  feedback: string;
  reason: string;
};

type RewritePlanItem = {
  section: string;
  rewriteDirection: string;
  why: string;
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
  const [isDragActive, setIsDragActive] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [importedProfile, setImportedProfile] = useState<ImportedProfile>(emptyImportedProfile);
  const [rawResumeText, setRawResumeText] = useState("");
  const [rewrittenResume, setRewrittenResume] = useState("");
  const [topFeedback, setTopFeedback] = useState<TopFeedbackItem[]>([]);
  const [rewritePlan, setRewritePlan] = useState<RewritePlanItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const rewrittenWordCount = rewrittenResume.trim() ? rewrittenResume.trim().split(/\s+/).length : 0;

  function chooseFile(candidate: File | null) {
    if (!candidate) {
      return;
    }

    const isPdf = candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setStatus("Only PDF files are supported.");
      return;
    }

    setFile(candidate);
    setStatus(`Ready to import: ${candidate.name}`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    chooseFile(event.dataTransfer.files?.[0] ?? null);
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
      setTopFeedback([]);
      setRewritePlan([]);
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
        topFeedback?: TopFeedbackItem[];
        rewritePlan?: RewritePlanItem[];
        rewrittenResume?: string;
        parsedProfile?: ImportedProfile;
        error?: string;
      };

      if (
        !response.ok ||
        !payload.rewrittenResume ||
        !payload.parsedProfile ||
        !payload.topFeedback ||
        !payload.rewritePlan
      ) {
        throw new Error(payload.error ?? "Failed to enhance resume.");
      }

      setTopFeedback(payload.topFeedback);
      setRewritePlan(payload.rewritePlan);
      setRewrittenResume(payload.rewrittenResume);
      setImportedProfile(payload.parsedProfile);
      setStatus("Resume updated with AI suggestions.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to enhance resume.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfileFromUpdatedResume() {
    if (!(rewrittenResume || rawResumeText)) {
      setStatus("No resume text available to parse.");
      return;
    }

    setLoading(true);
    setStatus("Updating profile fields from latest resume text...");

    try {
      const response = await fetch("/api/profile/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawResumeText: rewrittenResume || rawResumeText,
        }),
      });

      const payload = (await response.json()) as {
        parsedProfile?: ImportedProfile;
        error?: string;
      };

      if (!response.ok || !payload.parsedProfile) {
        throw new Error(payload.error ?? "Failed to update profile from resume.");
      }

      setImportedProfile(payload.parsedProfile);
      setStatus("Profile fields refreshed from updated resume text.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update profile from resume.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadDocx() {
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

      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const fileNameFromHeader = contentDisposition.match(/filename="([^"]+)"/)?.[1];
      const fileName =
        fileNameFromHeader ??
        `${(importedProfile.name || "candidate").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-resume.docx`;

      const bytes = await response.arrayBuffer();
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setStatus("Downloaded .docx resume with polished formatting.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to export resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="card stack">
        <h1>1. Upload Resume</h1>
        <form onSubmit={handleImport} className="stack">
          <div
            className="card"
            style={{
              borderStyle: "dashed",
              borderWidth: "2px",
              borderColor: isDragActive ? "#111827" : "#9ca3af",
              background: isDragActive ? "#f3f4f6" : "transparent",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p>{file ? `Selected: ${file.name}` : "Drag and drop your PDF resume here."}</p>
            <p className="small">Or use the file picker below.</p>
          </div>
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
        </form>
        <p className="small">{status}</p>
      </section>

      <section className="card stack">
        <h2>2. Review Imported Profile</h2>
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
      </section>

      <section className="card stack">
        <h2>3. Run AI Resume Edits</h2>
        <button type="button" disabled={loading} onClick={() => void handleEnhanceResume()}>
          Run AI Resume Edits
        </button>
        <h3>Top Feedback</h3>
        {topFeedback.length ? (
          <ul className="stack">
            {topFeedback.map((item) => (
              <li key={`${item.feedback}-${item.reason}`}>
                <strong>{item.feedback}</strong>
                <br />
                <span className="small">{item.reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">Run AI edits to generate top feedback.</p>
        )}
        <h3>Rewrite Plan (What + Why)</h3>
        {rewritePlan.length ? (
          <ul className="stack">
            {rewritePlan.map((item) => (
              <li key={`${item.section}-${item.rewriteDirection}`}>
                <strong>{item.section}</strong>: {item.rewriteDirection}
                <br />
                <span className="small">Why: {item.why}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">Run AI edits to generate section-by-section rewrite guidance.</p>
        )}
      </section>

      <section className="card stack">
        <h2>4. Updated Resume Text</h2>
        <p className="small">
          Word count: {rewrittenWordCount}. One-page target: roughly 420-650 words on US Letter (11pt).
        </p>
        <textarea
          value={rewrittenResume}
          onChange={(e) => setRewrittenResume(e.target.value)}
          placeholder="AI rewritten resume will appear here."
        />
      </section>

      <section className="card stack">
        <h2>4.5 Sync + Save Final Profile</h2>
        <p className="small">
          If you edited the resume text above, refresh profile fields from that latest text before saving.
        </p>
        <button type="button" disabled={loading} onClick={() => void handleUpdateProfileFromUpdatedResume()}>
          Update Profile From Updated Resume
        </button>
        <button type="button" disabled={loading} onClick={() => void handleSave()}>
          Save Final Profile
        </button>
      </section>

      <section className="card stack">
        <h2>5. Download Resume</h2>
        <button type="button" disabled={loading} onClick={() => void handleDownloadDocx()}>
          Download Resume DOCX
        </button>
      </section>
    </main>
  );
}
