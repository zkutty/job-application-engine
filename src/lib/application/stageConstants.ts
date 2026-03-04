export const APPLICATION_STAGES = [
  "exploring",
  "interested",
  "in_progress",
  "applied",
  "screening",
  "interviewing",
  "final_round",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const APPLICATION_STAGE_LABELS: Record<ApplicationStage, string> = {
  exploring: "Exploring",
  interested: "Interested",
  in_progress: "In Progress",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  final_round: "Final Round",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
