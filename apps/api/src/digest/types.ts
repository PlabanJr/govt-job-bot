export interface DigestItem {
  jobId: string;
  title: string;
  eligibilitySummary: string;
  lastDate: string | null;
  sourceUrl: string;
  sourcePdfUrl: string | null;
}

export interface DigestPayload {
  userId: string;
  items: DigestItem[];
}
