"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Mode = "login" | "register";

type AuthPanelProps = {
  initialMode?: Mode;
  title?: string;
  intro?: string;
  compact?: boolean;
};

export function AuthPanel({
  initialMode = "register",
  title = "Start tailoring smarter applications",
  intro = "Create an account to save your profile, story bank, jobs, and generated artifacts in one place.",
  compact = false,
}: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorMessage = new URLSearchParams(window.location.search).get("error");
    if (errorMessage) {
      setStatus(errorMessage);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(mode === "login" ? "Signing in..." : "Creating account...");

    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Authentication failed.");
      }

      setStatus("Success. Redirecting...");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`authPanel ${compact ? "authPanelCompact" : ""}`}>
      <div className="stack authPanelIntro">
        <div className="authModeSwitch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`authModeButton ${mode === "register" ? "authModeButtonActive" : ""}`}
            onClick={() => {
              setMode("register");
              setStatus("");
            }}
          >
            Create account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`authModeButton ${mode === "login" ? "authModeButtonActive" : ""}`}
            onClick={() => {
              setMode("login");
              setStatus("");
            }}
          >
            Sign in
          </button>
        </div>
        <div className="stack authPanelHeading">
          <h2>{title}</h2>
          <p className="small">{intro}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <label htmlFor={`auth-email-${compact ? "compact" : "full"}`}>
          Email
          <input
            id={`auth-email-${compact ? "compact" : "full"}`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label htmlFor={`auth-password-${compact ? "compact" : "full"}`}>
          Password
          <input
            id={`auth-password-${compact ? "compact" : "full"}`}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
        </label>

        <button type="submit" disabled={loading}>
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="authDivider" aria-hidden="true">
          <span>or</span>
        </div>

        <button
          type="button"
          className="secondaryButton authGoogleButton"
          onClick={() => {
            window.location.href = "/api/auth/google/start";
          }}
        >
          Continue with Google
        </button>

        {mode === "login" ? (
          <p className="small">
            <Link href="/reset-password">Forgot password?</Link>
          </p>
        ) : null}
      </form>

      <div className="authPanelFooter stack">
        <p className="small">
          Your saved roles, stories, and generated artifacts stay private to your account.
        </p>
        <p className={`small authStatus ${status ? "authStatusVisible" : ""}`} role="status" aria-live="polite">
          {status || " "}
        </p>
      </div>
    </section>
  );
}
