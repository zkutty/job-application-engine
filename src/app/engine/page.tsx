import { CoverLetterForm } from "@/components/cover-letter-form";
import { DonationCard } from "@/components/donation-card";

export default function EnginePage() {
  return (
    <main className="stack">
      <CoverLetterForm />
      <DonationCard />
    </main>
  );
}
