export interface IngestedJob {
  organization: string;
  postTitle: string;
  vacanciesCount: number | null;
  payLevel: string | null;
  location: string | null;
  eligibilityEducation: string[];
  eligibilityAgeMin: number | null;
  eligibilityAgeMax: number | null;
  eligibilityCategoryRelaxations: Record<string, number> | null;
  eligibilityPwd: boolean | null;
  eligibilityExServiceman: boolean | null;
  eligibilityGender: string | null;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  sourceUrl: string;
  sourcePdfUrl: string | null;
}

export interface SourceDefinition {
  id: string;
  name: string;
  listUrl: string;
  enabled: boolean;
  parse: (html: string, baseUrl: string) => IngestedJob[];
}

export interface IngestionResult {
  sourceId: string;
  itemsFound: number;
  itemsNew: number;
  itemsUpdated: number;
  error?: string;
}
