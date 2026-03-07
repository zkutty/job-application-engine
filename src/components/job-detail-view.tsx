"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  APPLICATION_STAGES,
  APPLICATION_STAGE_LABELS,
  type ApplicationStage,
} from "@/lib/application/stageConstants";

type JobNote = {
  id: number;
  createdAt: string;
  updatedAt: string;
  stage: ApplicationStage;
  content: string;
};

type JobDetail = {
  id: number;
  createdAt: string;
  company: string;
  title: string;
  jdText: string;
  jdSummary: string;
  applicationStage: ApplicationStage;
  coverLetter: {
    id: number;
    type: string;
    content: string;
    createdAt: string;
  } | null;
  questionBank: {
    id: number;
    type: string;
    content: string;
    createdAt: string;
  } | null;
  notes: JobNote[];
};

type JobDetailViewProps = {
  jobId: number | null;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteStageDraft, setNoteStageDraft] = useState<ApplicationStage>("exploring");
  const [selectedApplicationStage, setSelectedApplicationStage] = useState<ApplicationStage>("exploring");
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) {
      setError("Invalid job id.");
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "GET" });
      const payload = (await response.json()) as { job?: JobDetail; error?: string };

      if (!response.ok || !payload.job) {
        throw new Error(payload.error ?? "Failed to load job.");
      }

      setJob(payload.job);
      setSelectedApplicationStage(payload.job.applicationStage);
      setNoteStageDraft(payload.job.applicationStage);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load job."));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  async function handleSaveStage() {
    if (!jobId || !job) return;

    setIsSavingStage(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationStage: selectedApplicationStage }),
      });
      const payload = (await response.json()) as {
        error?: string;
        job?: { applicationStage?: ApplicationStage };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update stage.");
      }

      const nextStage = payload.job?.applicationStage ?? selectedApplicationStage;
      setJob({ ...job, applicationStage: nextStage });
      setNoteStageDraft(nextStage);
    } catch (stageError) {
      setError(getErrorMessage(stageError, "Failed to update stage."));
    } finally {
      setIsSavingStage(false);
    }
  }

  async function handleCreateNote() {
    if (!jobId || !job) return;

    const content = noteDraft.trim();
    if (!content) {
      setError("Note content is required.");
      return;
    }

    setIsSavingNote(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, stage: noteStageDraft }),
      });
      const payload = (await response.json()) as { note?: JobNote; error?: string };
      if (!response.ok || !payload.note) {
        throw new Error(payload.error ?? "Failed to save note.");
      }

      setJob({ ...job, notes: [payload.note, ...job.notes] });
      setNoteDraft("");
    } catch (noteError) {
      setError(getErrorMessage(noteError, "Failed to save note."));
    } finally {
      setIsSavingNote(false);
    }
  }

  if (isLoading) {
    return <p className="small">Loading job...</p>;
  }

  if (error) {
    return (
      <section className="card stack">
        <p className="error">{error}</p>
        <Link href="/" className="primaryLinkButton">
          Back to Jobs
        </Link>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="card stack">
        <p className="small">Job not found.</p>
        <Link href="/" className="primaryLinkButton">
          Back to Jobs
        </Link>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="card stack">
        <div className="jobsHeaderRow">
          <div>
            <h1>
              {job.company} - {job.title}
            </h1>
            <p className="small">Saved {new Date(job.createdAt).toLocaleString()}</p>
          </div>
          <div className="buttonRow">
            <Link href="/" className="primaryLinkButton secondaryLinkButton">
              Back to Jobs
            </Link>
            <Link href="/engine" className="primaryLinkButton">
              Open Engine
            </Link>
          </div>
        </div>

        <label htmlFor="applicationStage">Application Stage</label>
        <div className="buttonRow">
          <select
            id="applicationStage"
            value={selectedApplicationStage}
            onChange={(event) => setSelectedApplicationStage(event.target.value as ApplicationStage)}
          >
            {APPLICATION_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {APPLICATION_STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => void handleSaveStage()} disabled={isSavingStage}>
            {isSavingStage ? "Saving Stage..." : "Save Stage"}
          </button>
        </div>
      </section>

      <section className="card stack">
        <h2>Saved Job Description</h2>
        <pre className="output">{job.jdText}</pre>
      </section>

      <section className="card stack">
        <h2>Saved Cover Letter</h2>
        {job.coverLetter ? <pre className="output">{job.coverLetter.content}</pre> : <p className="small">No saved cover letter yet.</p>}
      </section>

      <section className="card stack">
        <h2>Saved Question Bank</h2>
        {job.questionBank ? (
          <pre className="output">{job.questionBank.content}</pre>
        ) : (
          <p className="small">No saved question bank yet.</p>
        )}
      </section>

      <section className="card stack">
        <h2>Notes</h2>
        <label htmlFor="noteStage">Stage for New Note</label>
        <select
          id="noteStage"
          value={noteStageDraft}
          onChange={(event) => setNoteStageDraft(event.target.value as ApplicationStage)}
        >
          {APPLICATION_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {APPLICATION_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        <label htmlFor="noteDraft">New Note</label>
        <textarea
          id="noteDraft"
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="Add recruiter updates, interview outcomes, or follow-ups..."
        />
        <button type="button" onClick={() => void handleCreateNote()} disabled={isSavingNote}>
          {isSavingNote ? "Saving Note..." : "Add Note"}
        </button>

        {job.notes.length === 0 ? (
          <p className="small">No notes yet for this job.</p>
        ) : (
          <ul>
            {job.notes.map((note) => (
              <li key={note.id}>
                <div className="small noteMeta">
                  <div>
                    <span className={`stageBadge stage-${note.stage}`}>{APPLICATION_STAGE_LABELS[note.stage]}</span>{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </div>
                </div>
                <pre className="output">{note.content}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
