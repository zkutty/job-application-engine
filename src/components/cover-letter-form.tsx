"use client";

import { useEffect, useState, type ClipboardEvent, type FormEvent } from "react";

type HistoryItem = {
  id: number;
  createdAt: string;
  jdPreview: string;
};

type JdAnalysis = {
  companyGuess: string;
  roleTitleGuess: string;
  seniorityGuess: string;
  competencies: string[];
  keywords: string[];
  tools: string[];
};

type SavedQuestionBank = {
  artifactId: number;
  createdAt: string;
  markdown: string;
  jobId: number;
  company: string;
  roleTitle: string;
  displayName: string;
  jdPreview: string;
  jdText: string;
};

function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error instanceof Event) {
    return fallback;
  }
  return fallback;
}

export function CoverLetterForm() {
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [questionBankMarkdown, setQuestionBankMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [questionBankError, setQuestionBankError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  const [isGeneratingQuestionBank, setIsGeneratingQuestionBank] = useState(false);
  const [savedQuestionBanks, setSavedQuestionBanks] = useState<SavedQuestionBank[]>([]);
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState<number | null>(null);
  const [renameCompany, setRenameCompany] = useState("");
  const [renameRole, setRenameRole] = useState("");

  const [analysis, setAnalysis] = useState<JdAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function loadHistory() {
    try {
      const response = await fetch("/api/history", { method: "GET" });
      const payload = (await response.json()) as { history?: HistoryItem[] };

      if (response.ok && payload.history) {
        setHistory(payload.history);
      }
    } catch {
      // Ignore history load errors in UI; generation can still proceed.
    }
  }

  async function loadQuestionBankHistory() {
    try {
      const response = await fetch("/api/question-bank", { method: "GET" });
      const payload = (await response.json()) as { questionBanks?: SavedQuestionBank[] };
      if (response.ok && payload.questionBanks) {
        setSavedQuestionBanks(payload.questionBanks);
      }
    } catch {
      // Ignore load errors; generation still works.
    }
  }

  useEffect(() => {
    void loadHistory();
    void loadQuestionBankHistory();
  }, []);

  useEffect(() => {
    if (!selectedQuestionBankId) {
      setRenameCompany("");
      setRenameRole("");
      return;
    }

    const selected = savedQuestionBanks.find((item) => item.artifactId === selectedQuestionBankId);
    if (!selected) {
      return;
    }

    setRenameCompany(selected.company);
    setRenameRole(selected.roleTitle);
  }, [savedQuestionBanks, selectedQuestionBankId]);

  async function runAnalysis(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 40 && !looksLikeUrl(trimmed)) {
      return;
    }

    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/jd-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jdText: text }),
      });

      const payload = (await response.json()) as { analysis?: JdAnalysis; error?: string };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error ?? "Failed to analyze job description.");
      }

      setAnalysis(payload.analysis);
    } catch (analyzeError) {
      setAnalysisError(getErrorMessage(analyzeError, "Failed to analyze job description."));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function extractAndPopulateJobDescription(input: string) {
    setError(null);
    setAnalysisError(null);
    setIsExtractingJd(true);

    try {
      const response = await fetch("/api/jd-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      const payload = (await response.json()) as { jobDescription?: string; error?: string };
      if (!response.ok || !payload.jobDescription) {
        throw new Error(payload.error ?? "Failed to extract job description from URL.");
      }

      setJobDescription(payload.jobDescription);
      await runAnalysis(payload.jobDescription);
    } catch (extractError) {
      setError(getErrorMessage(extractError, "Failed to extract job description from URL."));
    } finally {
      setIsExtractingJd(false);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData("text").trim();
    if (looksLikeUrl(pasted)) {
      event.preventDefault();
      setJobUrlInput(pasted);
      void extractAndPopulateJobDescription(pasted);
      return;
    }

    const textarea = event.currentTarget;

    window.setTimeout(() => {
      void runAnalysis(textarea.value);
    }, 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      const payload = (await response.json()) as { coverLetter?: string; error?: string };

      if (!response.ok || !payload.coverLetter) {
        throw new Error(payload.error ?? "Failed to generate cover letter.");
      }

      setCoverLetter(payload.coverLetter);
      await loadHistory();
    } catch (submissionError) {
      setError(getErrorMessage(submissionError, "Failed to generate cover letter."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateQuestionBank() {
    setQuestionBankError(null);
    setIsGeneratingQuestionBank(true);

    try {
      const response = await fetch("/api/question-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      const payload = (await response.json()) as { markdown?: string; error?: string };

      if (!response.ok || !payload.markdown) {
        throw new Error(payload.error ?? "Failed to generate question bank.");
      }

      setQuestionBankMarkdown(payload.markdown);
      await loadHistory();
      await loadQuestionBankHistory();
    } catch (generationError) {
      setQuestionBankError(getErrorMessage(generationError, "Failed to generate question bank."));
    } finally {
      setIsGeneratingQuestionBank(false);
    }
  }

  function handleLoadSavedQuestionBank() {
    if (!selectedQuestionBankId) {
      return;
    }

    const selected = savedQuestionBanks.find((item) => item.artifactId === selectedQuestionBankId);
    if (!selected) {
      return;
    }

    setQuestionBankMarkdown(selected.markdown);
    setJobDescription(selected.jdText);
    void runAnalysis(selected.jdText);
  }

  async function handleRenameSelectedJob() {
    if (!selectedQuestionBankId) {
      return;
    }

    const selected = savedQuestionBanks.find((item) => item.artifactId === selectedQuestionBankId);
    if (!selected) {
      return;
    }

    const company = renameCompany.trim();
    const title = renameRole.trim();
    if (!company || !title) {
      setQuestionBankError("Both company and role are required to rename.");
      return;
    }

    setQuestionBankError(null);

    try {
      const response = await fetch(`/api/jobs/${selected.jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company, title }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setQuestionBankError(payload.error ?? "Failed to rename saved JD.");
        return;
      }

      setSavedQuestionBanks((current) =>
        current.map((item) =>
          item.jobId === selected.jobId
            ? {
                ...item,
                company,
                roleTitle: title,
                displayName: `${company} - ${title}`,
              }
            : item,
        ),
      );
    } catch (renameError) {
      setQuestionBankError(getErrorMessage(renameError, "Failed to rename saved JD."));
    }
  }

  async function handleDeleteSelectedJob() {
    if (!selectedQuestionBankId) {
      return;
    }

    const selected = savedQuestionBanks.find((item) => item.artifactId === selectedQuestionBankId);
    if (!selected) {
      return;
    }

    setQuestionBankError(null);

    try {
      const response = await fetch(`/api/jobs/${selected.jobId}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setQuestionBankError(payload.error ?? "Failed to delete saved JD.");
        return;
      }

      setSavedQuestionBanks((current) => current.filter((item) => item.jobId !== selected.jobId));
      setSelectedQuestionBankId(null);
      setRenameCompany("");
      setRenameRole("");
      setQuestionBankMarkdown("");
    } catch (deleteError) {
      setQuestionBankError(getErrorMessage(deleteError, "Failed to delete saved JD."));
    }
  }

  function exportQuestionBankMarkdown() {
    if (!questionBankMarkdown) {
      return;
    }

    const blob = new Blob([questionBankMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "question-bank.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="layout">
      <div className="stack">
        <section className="card stack">
          <h1>Job Application Engine</h1>
          <p className="small">Paste a job description or a job-posting URL and generate a tailored cover letter.</p>
          <form onSubmit={handleSubmit} className="stack">
            <label htmlFor="jobUrlInput">Job URL (optional)</label>
            <div className="buttonRow">
              <input
                id="jobUrlInput"
                name="jobUrlInput"
                placeholder="https://job-boards.greenhouse.io/... or LinkedIn job URL"
                value={jobUrlInput}
                onChange={(event) => setJobUrlInput(event.target.value)}
              />
              <button
                type="button"
                onClick={() => void extractAndPopulateJobDescription(jobUrlInput)}
                disabled={isExtractingJd}
              >
                {isExtractingJd ? "Extracting JD..." : "Extract JD from URL"}
              </button>
            </div>
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              className="jdTextarea"
              id="jobDescription"
              name="jobDescription"
              placeholder="Paste job description text or a job URL (LinkedIn/company page)..."
              required
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              onPaste={handlePaste}
            />
            <div className="buttonRow">
              <button type="button" onClick={() => void runAnalysis(jobDescription)} disabled={isAnalyzing}>
                {isAnalyzing ? "Analyzing..." : "Analyze JD"}
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateQuestionBank()}
                disabled={isGeneratingQuestionBank}
              >
                {isGeneratingQuestionBank ? "Generating Q&A..." : "Generate Question Bank"}
              </button>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Cover Letter"}
              </button>
            </div>
          </form>
          {error ? <p className="error">{error}</p> : null}
          {questionBankError ? <p className="error">{questionBankError}</p> : null}
        </section>

        <section className="card stack">
          <h2>Saved Question Banks by Role</h2>
          {savedQuestionBanks.length === 0 ? (
            <p className="small">No saved question banks yet.</p>
          ) : (
            <>
              <label htmlFor="savedQuestionBank">Select a saved role/JD</label>
              <select
                id="savedQuestionBank"
                value={selectedQuestionBankId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedQuestionBankId(value ? Number(value) : null);
                }}
              >
                <option value="">Choose one...</option>
                {savedQuestionBanks.map((item) => (
                  <option key={item.artifactId} value={item.artifactId}>
                    {item.displayName} - {new Date(item.createdAt).toLocaleString()}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleLoadSavedQuestionBank} disabled={!selectedQuestionBankId}>
                Load Selected Question Bank
              </button>
              {selectedQuestionBankId ? (
                <>
                  <label htmlFor="renameCompany">Company</label>
                  <input
                    id="renameCompany"
                    value={renameCompany}
                    onChange={(event) => setRenameCompany(event.target.value)}
                  />
                  <label htmlFor="renameRole">Role</label>
                  <input id="renameRole" value={renameRole} onChange={(event) => setRenameRole(event.target.value)} />
                  <button type="button" onClick={() => void handleRenameSelectedJob()}>
                    Rename Selected JD
                  </button>
                  <button type="button" onClick={() => void handleDeleteSelectedJob()}>
                    Delete Selected JD
                  </button>
                </>
              ) : null}
              {selectedQuestionBankId ? (
                <p className="small">
                  JD Preview:{" "}
                  {savedQuestionBanks.find((item) => item.artifactId === selectedQuestionBankId)?.jdPreview}
                  ...
                </p>
              ) : null}
            </>
          )}
        </section>

        <section className="card stack">
          <h2>Generated Cover Letter</h2>
          {coverLetter ? (
            <div className="output">{coverLetter}</div>
          ) : (
            <p className="small">No cover letter generated yet.</p>
          )}
        </section>

        <section className="card stack">
          <h2>Generation History</h2>
          {history.length === 0 ? (
            <p className="small">No previous generations yet.</p>
          ) : (
            <ul>
              {history.map((entry) => (
                <li key={entry.id}>
                  <strong>{new Date(entry.createdAt).toLocaleString()}</strong>
                  <div className="small">JD: {entry.jdPreview}...</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card stack">
          <div className="buttonRow">
            <h2>Question Bank (Markdown)</h2>
            <button type="button" onClick={exportQuestionBankMarkdown} disabled={!questionBankMarkdown}>
              Export .md
            </button>
          </div>
          {questionBankMarkdown ? (
            <pre className="output">{questionBankMarkdown}</pre>
          ) : (
            <p className="small">No question bank generated yet.</p>
          )}
        </section>
      </div>

      <aside className="card stack">
        <h2>JD Insights</h2>
        {analysisError ? <p className="error">{analysisError}</p> : null}
        {!analysis ? (
          <p className="small">Paste a JD or click Analyze JD to extract competencies, keywords, and tools.</p>
        ) : (
          <>
            <div>
              <strong>Company Guess:</strong> <span className="small">{analysis.companyGuess}</span>
            </div>
            <div>
              <strong>Role Guess:</strong> <span className="small">{analysis.roleTitleGuess}</span>
            </div>
            <div>
              <strong>Seniority Guess:</strong> <span className="small">{analysis.seniorityGuess}</span>
            </div>

            <div>
              <strong>Competencies</strong>
              <ul>
                {analysis.competencies.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Keywords</strong>
              <ul>
                {analysis.keywords.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <strong>Tools</strong>
              <ul>
                {analysis.tools.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
