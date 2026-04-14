"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

  const supabase = createSupabaseBrowserClient();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(mode === "login" ? "Signing in..." : "Creating account...");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
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

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setStatus(error.message);
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
            minLength={6}
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
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </button>
      </form>

      <div className="authPanelFooter stack">
        <p className="small">
          Your saved roles, stories, and generated artifacts stay private to your account.
        </p>
        {mode === "register" && (
          <p className="small">
            By creating an account, you agree to our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        )}
        <p
          className={`small authStatus ${status ? "authStatusVisible" : ""}`}
          role="status"
          aria-live="polite"
        >
          {status || " "}
        </p>
      </div>
    </section>
  );
}
