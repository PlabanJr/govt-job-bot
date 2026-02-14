import { createHash } from "node:crypto";
import type { IngestedJob } from "./types";

export function computeSourceHash(job: IngestedJob): string {
  const raw = [
    job.organization,
    job.postTitle,
    job.sourceUrl,
    job.sourcePdfUrl ?? ""
  ].join("|");

  return createHash("sha256").update(raw).digest("hex");
}
