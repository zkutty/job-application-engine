"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/components/logout-button";

type AuthState = "loading" | "authenticated" | "anonymous";

type MeResponse = {
  user?: {
    id: string;
    email: string;
    createdAt: string;
  };
};

export function AuthNav() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAuthState() {
      try {
        const response = await fetch("/api/auth/me", { method: "GET", signal: controller.signal });
        if (response.status === 401) {
          setAuthState("anonymous");
          return;
        }

        const payload = (await response.json()) as MeResponse;
        setAuthState(response.ok && payload.user ? "authenticated" : "anonymous");
      } catch {
        if (!controller.signal.aborted) {
          setAuthState("anonymous");
        }
      }
    }

    void loadAuthState();

    return () => {
      controller.abort();
    };
  }, []);

  if (authState === "loading") {
    return <span className="small">Checking account...</span>;
  }

  if (authState === "authenticated") {
    return (
      <>
        <Link href="/account" className="navLink">
          Account
        </Link>
        <LogoutButton />
      </>
    );
  }

  return (
    <>
      <Link href="/account" className="navLink">
        Account
      </Link>
      <Link href="/login" className="navLink">
        Login
      </Link>
    </>
  );
}
