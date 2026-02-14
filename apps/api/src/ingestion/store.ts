import type { IngestedJob } from "./types";
import { query } from "../db/pool";
import { computeSourceHash } from "./hash";

export interface StoreResult {
  inserted: boolean;
  jobId: string | null;
}

export async function upsertJob(job: IngestedJob): Promise<StoreResult> {
  const sourceHash = computeSourceHash(job);

  const rows = await query<{
    id: string;
    inserted: boolean;
  }>(
    `INSERT INTO jobs (
      organization,
      post_title,
      vacancies_count,
      pay_level,
      location,
      eligibility_education,
      eligibility_age_min,
      eligibility_age_max,
      eligibility_category_relaxations,
      eligibility_pwd,
      eligibility_ex_serviceman,
      eligibility_gender,
      application_start_date,
      application_end_date,
      source_url,
      source_pdf_url,
      source_hash,
      last_seen_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,now()
    )
    ON CONFLICT (source_hash) DO UPDATE SET
      organization = EXCLUDED.organization,
      post_title = EXCLUDED.post_title,
      vacancies_count = EXCLUDED.vacancies_count,
      pay_level = EXCLUDED.pay_level,
      location = EXCLUDED.location,
      eligibility_education = EXCLUDED.eligibility_education,
      eligibility_age_min = EXCLUDED.eligibility_age_min,
      eligibility_age_max = EXCLUDED.eligibility_age_max,
      eligibility_category_relaxations = EXCLUDED.eligibility_category_relaxations,
      eligibility_pwd = EXCLUDED.eligibility_pwd,
      eligibility_ex_serviceman = EXCLUDED.eligibility_ex_serviceman,
      eligibility_gender = EXCLUDED.eligibility_gender,
      application_start_date = EXCLUDED.application_start_date,
      application_end_date = EXCLUDED.application_end_date,
      source_url = EXCLUDED.source_url,
      source_pdf_url = EXCLUDED.source_pdf_url,
      last_seen_at = now()
    RETURNING id, (xmax = 0) AS inserted`,
    [
      job.organization,
      job.postTitle,
      job.vacanciesCount,
      job.payLevel,
      job.location,
      job.eligibilityEducation,
      job.eligibilityAgeMin,
      job.eligibilityAgeMax,
      job.eligibilityCategoryRelaxations,
      job.eligibilityPwd,
      job.eligibilityExServiceman,
      job.eligibilityGender,
      job.applicationStartDate,
      job.applicationEndDate,
      job.sourceUrl,
      job.sourcePdfUrl,
      sourceHash
    ]
  );

  const [row] = rows;
  return { inserted: row?.inserted ?? false, jobId: row?.id ?? null };
}
