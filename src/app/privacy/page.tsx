import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — HireSage",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container narrowContainer">
      <div className="stack" style={{ gap: "1.5rem" }}>
        <div>
          <h1>Privacy Policy</h1>
          <p className="small">Last updated: April 13, 2026</p>
        </div>

        <section className="stack">
          <h2>1. Information We Collect</h2>
          <p>
            When you use HireSage, we collect the following categories of
            information:
          </p>
          <p>
            <strong>Account information:</strong> Your email address and
            password (hashed) when you create an account, or your email via
            Google OAuth if you choose that sign-in method.
          </p>
          <p>
            <strong>Professional profile data:</strong> Your name, headline,
            summary, skills, voice/writing guidelines, and resume text that you
            provide to build your candidate profile.
          </p>
          <p>
            <strong>Job and application data:</strong> Job titles, company
            names, job descriptions, application stage, notes, and any generated
            artifacts (cover letters, question banks, resume suggestions).
          </p>
          <p>
            <strong>Experience stories:</strong> STAR-format stories you create,
            including situation, action, result, and tags.
          </p>
          <p>
            <strong>Payment information:</strong> When you make a donation or
            subscribe, Stripe collects your payment details. We store your
            Stripe customer ID, subscription status, and donation history but
            never your credit card number.
          </p>
        </section>

        <section className="stack">
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and operate the HireSage service</li>
            <li>
              Generate tailored cover letters, question banks, and other
              application artifacts using AI
            </li>
            <li>Analyze job descriptions to identify key requirements</li>
            <li>Parse and enhance your resume</li>
            <li>Process payments and manage subscriptions</li>
            <li>Communicate with you about your account</li>
          </ul>
        </section>

        <section className="stack">
          <h2>3. Third-Party Services</h2>
          <p>We share data with the following third-party processors:</p>
          <p>
            <strong>OpenAI:</strong> Your job descriptions, profile summaries,
            voice guidelines, selected experience stories, and resume text are
            sent to OpenAI&rsquo;s API to generate application materials. OpenAI
            processes this data according to their{" "}
            <a
              href="https://openai.com/policies/api-data-usage-policies"
              target="_blank"
              rel="noopener noreferrer"
            >
              API data usage policy
            </a>
            .
          </p>
          <p>
            <strong>Supabase:</strong> Provides authentication and database
            hosting. Your account data and application data are stored on
            Supabase infrastructure.
          </p>
          <p>
            <strong>Stripe:</strong> Handles payment processing for donations
            and subscriptions. Your email and payment details are processed by
            Stripe according to their{" "}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>
            .
          </p>
          <p>
            <strong>Google:</strong> If you sign in with Google OAuth, Google
            shares your email address with us for authentication purposes.
          </p>
        </section>

        <section className="stack">
          <h2>4. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may
            delete individual jobs, stories, and notes at any time. If you wish
            to delete your entire account and all associated data, please
            contact us at the email below.
          </p>
        </section>

        <section className="stack">
          <h2>5. Data Security</h2>
          <p>
            We use industry-standard security measures including encrypted
            connections (HTTPS), hashed passwords, and secure authentication
            tokens. However, no method of transmission or storage is 100%
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="stack">
          <h2>6. Cookies</h2>
          <p>
            HireSage uses essential cookies for authentication and session
            management. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section className="stack">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data</li>
            <li>Export your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p>
            If you are a California resident, you have additional rights under
            the CCPA including the right to know what personal information is
            collected and the right to opt out of the sale of personal
            information. We do not sell your personal information.
          </p>
        </section>

        <section className="stack">
          <h2>8. Children&rsquo;s Privacy</h2>
          <p>
            HireSage is not intended for use by anyone under the age of 16. We
            do not knowingly collect personal information from children.
          </p>
        </section>

        <section className="stack">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            you of material changes by posting the updated policy on this page
            with a revised date.
          </p>
        </section>

        <section className="stack">
          <h2>10. Contact</h2>
          <p>
            If you have questions about this privacy policy or wish to exercise
            your data rights, please contact us at{" "}
            <a href="mailto:privacy@hiresage.com">privacy@hiresage.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
