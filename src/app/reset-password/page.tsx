"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const hasToken = token.length > 0;

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("Preparing reset link...");
    setResetUrl("");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; message?: string; resetUrl?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not prepare password reset.");
      }

      setStatus(payload.message ?? "If that account exists, a reset link is ready.");
      if (payload.resetUrl) {
        setResetUrl(payload.resetUrl);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not prepare password reset.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("Resetting password...");

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not reset password.");
      }

      setStatus(payload.message ?? "Password updated. Return to sign in.");
      setPassword("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <h1>{hasToken ? "Set New Password" : "Reset Password"}</h1>
      <p className="small">
        {hasToken
          ? "Enter a new password for your account."
          : "Enter your account email and we will generate a reset link."}
      </p>

      {hasToken ? (
        <form onSubmit={handleConfirm}>
          <label>
            New Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <button type="submit" disabled={loading}>
              Update Password
            </button>
            <Link href="/login">Back to sign in</Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRequest}>
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

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <button type="submit" disabled={loading}>
              Generate Reset Link
            </button>
            <Link href="/login">Back to sign in</Link>
          </div>
        </form>
      )}

      <p className="small" style={{ marginTop: 16 }}>
        {status}
      </p>

      {resetUrl ? (
        <p className="small" style={{ marginTop: 8 }}>
          Local dev link: <a href={resetUrl}>{resetUrl}</a>
        </p>
      ) : null}
    </main>
  );
}
