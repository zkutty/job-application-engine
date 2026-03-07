"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DonationCard } from "@/components/donation-card";
import { LogoutButton } from "@/components/logout-button";

type MeResponse = {
  user?: {
    id: number;
    email: string;
    createdAt: string;
  };
  error?: string;
};

type AccountState = "loading" | "authenticated" | "anonymous" | "error";

export function AccountPage() {
  const [accountState, setAccountState] = useState<AccountState>("loading");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", { method: "GET", signal: controller.signal });
        const payload = (await response.json()) as MeResponse;

        if (response.status === 401) {
          setAccountState("anonymous");
          return;
        }

        if (!response.ok || !payload.user) {
          setError(payload.error ?? "Failed to load account.");
          setAccountState("error");
          return;
        }

        setEmail(payload.user.email);
        setCreatedAt(payload.user.createdAt);
        setAccountState("authenticated");
      } catch {
        if (controller.signal.aborted) return;
        setError("Failed to load account.");
        setAccountState("error");
      }
    }

    void loadAccount();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="stack">
      <section className="card stack">
        <h1>Account</h1>
        {accountState === "loading" ? <p className="small">Checking your session...</p> : null}
        {accountState === "anonymous" ? (
          <>
            <p className="small">You are currently signed out.</p>
            <div className="buttonRow">
              <Link href="/login" className="primaryLinkButton">
                Sign In
              </Link>
              <Link href="/" className="primaryLinkButton secondaryLinkButton">
                Back to Jobs
              </Link>
            </div>
            <p className="small">
              Saved jobs are user-scoped, so you must sign in with the same account to see prior job history.
            </p>
          </>
        ) : null}
        {accountState === "error" ? <p className="error">{error}</p> : null}
        {accountState === "authenticated" ? (
          <>
            <p className="small">
              Signed in as <strong>{email}</strong>
            </p>
            {createdAt ? <p className="small">Member since {new Date(createdAt).toLocaleString()}</p> : null}
            <div className="buttonRow">
              <Link href="/" className="primaryLinkButton">
                View Jobs
              </Link>
              <Link href="/engine" className="primaryLinkButton secondaryLinkButton">
                Open Engine
              </Link>
              <LogoutButton className="secondaryButton" />
            </div>
          </>
        ) : null}
      </section>

      {accountState === "authenticated" ? <DonationCard /> : null}
    </div>
  );
}
