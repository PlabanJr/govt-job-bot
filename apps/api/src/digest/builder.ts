import type { Job, UserProfile } from "@govt-jobs/shared";
import { evaluateEligibility } from "@govt-jobs/shared";
import type { DigestItem, DigestPayload } from "./types";

export interface BuildDigestOptions {
  asOfDate?: Date;
}

export function buildDigest(user: UserProfile, jobs: Job[], options: BuildDigestOptions = {}): DigestPayload {
  const items: DigestItem[] = [];

  for (const job of jobs) {
    const result = evaluateEligibility(job, user, { asOfDate: options.asOfDate });
    if (!result.eligible) continue;

    const eligibilitySummary = job.eligibilityEducation.length
      ? `Education: ${job.eligibilityEducation.join(", ")}`
      : "See official notice";

    items.push({
      jobId: job.id,
      title: `${job.organization} — ${job.postTitle}`,
      eligibilitySummary,
      lastDate: job.applicationEndDate,
      sourceUrl: job.sourceUrl,
      sourcePdfUrl: job.sourcePdfUrl
    });
  }

  return { userId: user.id, items };
}
