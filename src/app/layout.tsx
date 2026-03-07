import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = {
  title: "HireSage",
  description: "Apply with wisdom. Generate tailored job application artifacts with AI guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="topNav">
          <nav>
            <Link href="/" className="brandLink">
              HireSage
            </Link>
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
            <Link href="/login" className="navLink">
              Login
            </Link>
            <LogoutButton />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
