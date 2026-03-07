"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
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
    <main className="container" style={{ maxWidth: 520 }}>
      <h1>{mode === "login" ? "Sign In" : "Create Account"}</h1>
      <p className="small">
        {mode === "login"
          ? "Sign in to view your saved profile, stories, JDs, and question banks."
          : "Create a profile so your artifacts are private to your account."}
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
        </label>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setStatus("");
            }}
          >
            {mode === "login" ? "Need an account?" : "Have an account?"}
          </button>
        </div>
        {mode === "login" ? (
          <p className="small" style={{ marginTop: 8 }}>
            <Link href="/reset-password">Forgot password?</Link>
          </p>
        ) : null}
      </form>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/api/auth/google/start";
          }}
        >
          Continue with Google
        </button>
      </div>

      <p className="small" style={{ marginTop: 16 }}>
        {status}
      </p>
    </main>
  );
}
