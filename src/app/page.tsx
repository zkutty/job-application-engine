import Link from "next/link";

import { AuthPanel } from "@/components/auth-panel";
import { JobsHome } from "@/components/jobs-home";
import { getCurrentUser } from "@/lib/auth/currentUser";

const workflowSteps = [
  {
    step: "01",
    title: "Paste the role",
    description: "Drop in a job description or posting URL so HireSage can extract the responsibilities, signals, and language that matter.",
  },
  {
    step: "02",
    title: "Match your evidence",
    description: "Map the role to your profile and story bank so every draft is grounded in work you have actually done.",
  },
  {
    step: "03",
    title: "Generate and save artifacts",
    description: "Produce a tailored cover letter, resume support, and reusable answers, then keep each version tied to the job.",
  },
] as const;

const featureCards = [
  {
    title: "Tailored cover letters",
    description: "Generate drafts that mirror the role language without turning into copied boilerplate.",
  },
  {
    title: "Resume and answer support",
    description: "Use the same job analysis to shape resume bullets and short-form application responses.",
  },
  {
    title: "Per-job history",
    description: "Save each role, artifact, and note so you can return to the thread of an application without rebuilding context.",
  },
] as const;

const guardrails = [
  "No invented metrics. Missing proof stays clearly marked.",
  "Outputs stay editable so you can tighten the final narrative.",
  "Every artifact is saved against the specific role it was created for.",
  "Your profile, stories, and drafts stay scoped to your account.",
] as const;

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    return (
      <main>
        <JobsHome />
      </main>
    );
  }

  return (
    <main className="landingPage">
      <section className="landingHero">
        <div className="heroContent stack">
          <div className="heroEyebrow">Job application engine</div>
          <div className="stack heroCopy">
            <h1>Tailor every application without rewriting from scratch.</h1>
            <p className="heroBody">
              HireSage maps each job description to your profile and story bank, then generates tailored application materials you can refine, save, and reuse.
            </p>
          </div>
          <div className="heroPills" aria-label="Product highlights">
            <span className="heroPill">Paste a JD</span>
            <span className="heroPill">Match real experience</span>
            <span className="heroPill">Save artifact history</span>
          </div>
          <div className="buttonRow">
            <Link href="#auth" className="primaryLinkButton">
              Start free
            </Link>
            <Link href="#how-it-works" className="primaryLinkButton secondaryLinkButton">
              See how it works
            </Link>
          </div>
          <div className="landingPreviewCard">
            <div className="previewHeader">
              <div>
                <p className="previewLabel">What you get</p>
                <h2>One place to run each application from first draft to follow-up.</h2>
              </div>
              <span className="previewBadge">Saved per role</span>
            </div>
            <div className="previewGrid">
              <div className="previewPane">
                <p className="previewPaneLabel">Job snapshot</p>
                <strong>Senior Product Designer at Northbeam</strong>
                <p className="small">JD analyzed, company inferred, stage tracked, notes attached.</p>
              </div>
              <div className="previewPane">
                <p className="previewPaneLabel">Generated artifacts</p>
                <ul>
                  <li>Cover letter draft with editable placeholders</li>
                  <li>Resume bullet suggestions aligned to the role</li>
                  <li>Short-form answers you can reuse and tune</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div id="auth">
          <AuthPanel />
        </div>
      </section>

      <section id="how-it-works" className="landingSection stack">
        <div className="sectionHeading">
          <p className="sectionEyebrow">How it works</p>
          <h2>A simple workflow built for repeatable, higher-quality applications.</h2>
        </div>
        <div className="processGrid">
          {workflowSteps.map((item) => (
            <article key={item.step} className="processCard">
              <p className="processStep">{item.step}</p>
              <h3>{item.title}</h3>
              <p className="small">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="landingSection stack">
        <div className="sectionHeading">
          <p className="sectionEyebrow">What HireSage helps with</p>
          <h2>Less repetitive drafting, clearer evidence, better application hygiene.</h2>
        </div>
        <div className="featureGrid">
          {featureCards.map((feature) => (
            <article key={feature.title} className="featureCard">
              <h3>{feature.title}</h3>
              <p className="small">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection landingTrustSection">
        <div className="sectionHeading">
          <p className="sectionEyebrow">Quality guardrails</p>
          <h2>Built to support credible drafts, not AI filler.</h2>
        </div>
        <div className="trustGrid">
          {guardrails.map((item) => (
            <div key={item} className="trustItem">
              <span className="trustBullet" aria-hidden="true">
                +
              </span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landingFooterCta">
        <div className="stack">
          <p className="sectionEyebrow">Ready to start?</p>
          <h2>Create an account and keep every application artifact organized by job.</h2>
        </div>
        <div className="buttonRow">
          <Link href="#auth" className="primaryLinkButton">
            Create account
          </Link>
          <Link href="/login" className="primaryLinkButton secondaryLinkButton">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
