"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APPLICATION_STAGE_LABELS, type ApplicationStage } from "@/lib/application/stageConstants";

type JobListItem = {
  id: number;
  createdAt: string;
  company: string;
  title: string;
  applicationStage: ApplicationStage;
  archived: boolean;
  artifactCount: number;
  noteCount: number;
};

type JobPreviewNote = {
  id: number;
  createdAt: string;
  stage: ApplicationStage;
  content: string;
};

type JobPreview = {
  id: number;
  company: string;
  title: string;
  applicationStage: ApplicationStage;
  jdSummary: string;
  notes: JobPreviewNote[];
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function JobsHome() {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedJobPreview, setSelectedJobPreview] = useState<JobPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [busyJobId, setBusyJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedJob = useMemo(
    () => (selectedJobId ? jobs.find((job) => job.id === selectedJobId) ?? null : null),
    [jobs, selectedJobId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const search = query.trim();
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (showArchived) params.set("includeArchived", "1");

        const queryString = params.toString();
        const response = await fetch(`/api/jobs${queryString ? `?${queryString}` : ""}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = (await response.json()) as { jobs?: JobListItem[]; error?: string };

        if (!response.ok || !payload.jobs) {
          throw new Error(payload.error ?? "Failed to load jobs.");
        }

        setJobs(payload.jobs);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(loadError, "Failed to load jobs."));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query, showArchived]);

  useEffect(() => {
    if (!selectedJobId) return;
    if (jobs.some((job) => job.id === selectedJobId)) return;

    setSelectedJobId(null);
    setSelectedJobPreview(null);
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJobPreview(null);
      return;
    }

    const controller = new AbortController();

    async function loadJobPreview() {
      setIsLoadingPreview(true);
      setError(null);

      try {
        const response = await fetch(`/api/jobs/${selectedJobId}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          job?: {
            id: number;
            company: string;
            title: string;
            applicationStage: ApplicationStage;
            jdSummary: string;
            notes: JobPreviewNote[];
          };
          error?: string;
        };

        if (!response.ok || !payload.job) {
          throw new Error(payload.error ?? "Failed to load job preview.");
        }

        setSelectedJobPreview(payload.job);
      } catch (previewError) {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(previewError, "Failed to load job preview."));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreview(false);
        }
      }
    }

    void loadJobPreview();

    return () => {
      controller.abort();
    };
  }, [selectedJobId]);

  async function handleArchive(jobId: number, archived: boolean) {
    setBusyJobId(jobId);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationStage: archived ? "withdrawn" : "exploring" }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update archive status.");
      }

      setJobs((current) => {
        if (!showArchived && archived) {
          return current.filter((job) => job.id !== jobId);
        }

        return current.map((job) =>
          job.id === jobId
            ? {
                ...job,
                archived,
                applicationStage: archived ? "withdrawn" : "exploring",
              }
            : job,
        );
      });
      if (!showArchived && archived && selectedJobId === jobId) {
        setSelectedJobId(null);
        setSelectedJobPreview(null);
      }
    } catch (archiveError) {
      setError(getErrorMessage(archiveError, "Failed to update archive status."));
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDelete(jobId: number) {
    if (!window.confirm("Delete this job and all associated artifacts/notes? This cannot be undone.")) {
      return;
    }

    setBusyJobId(jobId);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete job.");
      }

      setJobs((current) => current.filter((job) => job.id !== jobId));
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
        setSelectedJobPreview(null);
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Failed to delete job."));
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <div className="stack">
      <section className="card stack">
        <div className="jobsHeaderRow">
          <div>
            <h1>HireSage Workspace</h1>
            <p className="small">Track every saved role and move each application forward with clarity.</p>
          </div>
          <Link href="/engine" className="primaryLinkButton">
            New Job Application
          </Link>
        </div>

        <label htmlFor="jobSearch">Search jobs</label>
        <input
          id="jobSearch"
          placeholder="Search by company, title, or JD text..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="small inlineCheckbox" htmlFor="showArchived">
          <input
            id="showArchived"
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Show archived jobs
        </label>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <div className="jobsSplitLayout">
        <section className="card stack">
          <h2>{showArchived ? "Jobs (Active + Archived)" : "Active Jobs"}</h2>
          {isLoading ? <p className="small">Loading jobs...</p> : null}
          {!isLoading && jobs.length === 0 ? (
            <p className="small">
              {showArchived
                ? "No jobs match your current search."
                : "No active jobs yet. Generate a cover letter or question bank to create one."}
            </p>
          ) : null}
          {!isLoading && jobs.length > 0 ? (
            <ul className="jobList">
              {jobs.map((job) => (
                <li key={job.id} className={`jobListItem ${selectedJobId === job.id ? "jobListItemSelected" : ""}`}>
                  <button type="button" className="jobSelectButton" onClick={() => setSelectedJobId(job.id)}>
                    <div>
                      <strong>
                        {job.company} - {job.title}
                      </strong>
                      <div className="small">Saved {new Date(job.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="jobMeta">
                      <span className={`stageBadge stage-${job.applicationStage}`}>
                        {APPLICATION_STAGE_LABELS[job.applicationStage]}
                      </span>
                      <span className="small">
                        {job.archived ? "Archived" : "Active"} | {job.artifactCount} artifact
                        {job.artifactCount === 1 ? "" : "s"} | {job.noteCount} note{job.noteCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>

                  <div className="jobRowActions">
                    <button
                      type="button"
                      className="compactButton"
                      disabled={busyJobId === job.id}
                      onClick={() => void handleArchive(job.id, !job.archived)}
                    >
                      {busyJobId === job.id ? "Saving..." : job.archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      type="button"
                      className="compactButton dangerButton"
                      disabled={busyJobId === job.id}
                      onClick={() => void handleDelete(job.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <aside className="card stack">
          <h2>Selected Job Preview</h2>
          {!selectedJob ? <p className="small">Click a job to preview specs and notes.</p> : null}
          {selectedJob && isLoadingPreview ? <p className="small">Loading preview...</p> : null}
          {selectedJob && !isLoadingPreview && selectedJobPreview ? (
            <>
              <div>
                <strong>
                  {selectedJobPreview.company} - {selectedJobPreview.title}
                </strong>
                <div className="small">
                  <span className={`stageBadge stage-${selectedJobPreview.applicationStage}`}>
                    {APPLICATION_STAGE_LABELS[selectedJobPreview.applicationStage]}
                  </span>
                </div>
              </div>

              <div>
                <strong>Job Specs / JD Summary</strong>
                <pre className="output">{selectedJobPreview.jdSummary}</pre>
              </div>

              <div>
                <strong>Notes ({selectedJobPreview.notes.length})</strong>
                {selectedJobPreview.notes.length === 0 ? (
                  <p className="small">No notes yet.</p>
                ) : (
                  <ul>
                    {selectedJobPreview.notes.slice(0, 5).map((note) => (
                      <li key={note.id}>
                        <div className="small">
                          <span className={`stageBadge stage-${note.stage}`}>{APPLICATION_STAGE_LABELS[note.stage]}</span>{" "}
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                        <pre className="output">{note.content}</pre>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link href={`/jobs/${selectedJobPreview.id}`} className="primaryLinkButton">
                Open Full Job Record
              </Link>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
