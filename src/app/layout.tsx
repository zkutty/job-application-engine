import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Application Engine",
  description: "Generate tailored cover letters from job descriptions.",
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
            <Link href="/">Home</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/profile/import">Import Profile</Link>
            <Link href="/stories">Stories</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
