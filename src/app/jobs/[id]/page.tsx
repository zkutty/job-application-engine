import { JobDetailView } from "@/components/job-detail-view";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const resolved = await params;
  const id = Number(resolved.id);

  return (
    <main>
      <JobDetailView jobId={Number.isInteger(id) && id > 0 ? id : null} />
    </main>
  );
}
