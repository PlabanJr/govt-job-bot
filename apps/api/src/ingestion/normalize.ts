import type { IngestedJob } from "./types";

export function normalizeJob(job: IngestedJob): IngestedJob {
  return {
    ...job,
    vacanciesCount: job.vacanciesCount ?? null,
    payLevel: job.payLevel ?? null,
    location: job.location ?? null,
    eligibilityEducation: job.eligibilityEducation ?? [],
    eligibilityAgeMin: job.eligibilityAgeMin ?? null,
    eligibilityAgeMax: job.eligibilityAgeMax ?? null,
    eligibilityCategoryRelaxations: job.eligibilityCategoryRelaxations ?? null,
    eligibilityPwd: job.eligibilityPwd ?? null,
    eligibilityExServiceman: job.eligibilityExServiceman ?? null,
    eligibilityGender: job.eligibilityGender ?? null,
    applicationStartDate: job.applicationStartDate ?? null,
    applicationEndDate: job.applicationEndDate ?? null,
    sourcePdfUrl: job.sourcePdfUrl ?? null
  };
}
