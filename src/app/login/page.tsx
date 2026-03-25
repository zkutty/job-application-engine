import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <main className="loginLanding">
      <section className="loginIntro stack">
        <p className="sectionEyebrow">Welcome back</p>
        <h1>Sign in to resume your application workflow.</h1>
        <p className="loginBody">
          Access your saved jobs, profile, story bank, and generated artifacts. If you are new, you can create an account here and start from the same screen.
        </p>
        <div className="loginHighlights">
          <div className="loginHighlightCard">
            <h2>Inside the workspace</h2>
            <p className="small">Track roles, store versions, and keep notes tied to each application.</p>
          </div>
          <div className="loginHighlightCard">
            <h2>How to use it</h2>
            <p className="small">Paste a job description, match it to your experience, generate drafts, then edit and save the result.</p>
          </div>
        </div>
        <p className="small">
          Looking for the full overview first? <Link href="/">Return to the homepage</Link>.
        </p>
      </section>

      <div className="loginPanelWrap">
        <AuthPanel
          initialMode="login"
          title="Sign in or create an account"
          intro="Use the same account to keep your saved roles, stories, and generated artifacts organized."
          compact
        />
      </div>
    </main>
  );
}
