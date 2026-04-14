import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth/currentUser";

export const metadata: Metadata = {
  title: "HireSage",
  description: "Apply with wisdom. Generate tailored job application artifacts with AI guidance.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="topNav">
          <nav>
            <Link href="/" className="brandLink">
              HireSage
            </Link>
            {currentUser ? (
              <>
                <Link href="/" className="navLink">
                  Home
                </Link>
                <Link href="/engine" className="navLink">
                  Engine
                </Link>
                <Link href="/profile" className="navLink">
                  Profile
                </Link>
                <Link href="/profile/import" className="navLink">
                  Import Profile
                </Link>
                <Link href="/stories" className="navLink">
                  Stories
                </Link>
                <Link href="/account" className="navLink">
                  Account
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/#how-it-works" className="navLink">
                  How It Works
                </Link>
                <Link href="/#features" className="navLink">
                  Features
                </Link>
                <Link href="/login" className="navLink">
                  Login
                </Link>
                <Link href="/#auth" className="primaryLinkButton navCta">
                  Start Free
                </Link>
              </>
            )}
          </nav>
        </header>
        {children}
        <footer className="siteFooter">
          <div className="siteFooterInner">
            <p className="small">&copy; {new Date().getFullYear()} HireSage. All rights reserved.</p>
            <nav className="siteFooterLinks">
              <Link href="/privacy" className="small">Privacy Policy</Link>
              <Link href="/terms" className="small">Terms of Service</Link>
              <a href="mailto:support@hiresage.com" className="small">Contact</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
