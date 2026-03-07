"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APPLICATION_STAGE_LABELS, type ApplicationStage } from "@/lib/application/stageConstants";

type JobListItem = {
  id: number;
  createdAt: string;
  company: string;
  title: string;
  applicationStage: ApplicationStage;
  artifactCount: number;
  noteCount: number;
};

export function JobsHome() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const search = query.trim();
        const response = await fetch(`/api/jobs${search ? `?q=${encodeURIComponent(search)}` : ""}`, {
          method: "GET",
          signal: controller.signal,
        });
        const payload = (await response.json()) as { jobs?: JobListItem[]; error?: string };

        if (!response.ok || !payload.jobs) {
          throw new Error(payload.error ?? "Failed to load jobs.");
        }

        setJobs(payload.jobs);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load jobs.";
        setError(message);
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
  }, [query]);

  return (
    <div className="stack">
      <section className="card stack">
        <div className="jobsHeaderRow">
          <div>
            <h1>Job Application Engine</h1>
            <p className="small">Track all saved jobs and open each application workspace.</p>
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
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="card stack">
        <h2>Saved Jobs</h2>
        {isLoading ? <p className="small">Loading jobs...</p> : null}
        {!isLoading && jobs.length === 0 ? (
          <p className="small">No saved jobs yet. Generate a cover letter or question bank to create one.</p>
        ) : null}
        {!isLoading && jobs.length > 0 ? (
          <ul className="jobList">
            {jobs.map((job) => (
              <li key={job.id} className="jobListItem">
                <Link href={`/jobs/${job.id}`} className="jobListLink">
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
                      {job.artifactCount} artifact{job.artifactCount === 1 ? "" : "s"} | {job.noteCount} note
                      {job.noteCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
