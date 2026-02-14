export type Frequency = "daily" | "weekly";
export type Language = "en" | "hi";
export type Category = "GEN" | "EWS" | "OBC" | "SC" | "ST";

export interface Job {
  id: string;
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
  sourceHash: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  dob: string;
  highestQualification: string;
  category: Category;
  pwdStatus: boolean;
  exServiceman: boolean;
  gender?: string | null;
  locationPreference?: string | null;
  language: Language;
  frequency: Frequency;
  timezone: string;
  consentStatus: "opt_in" | "opt_out";
  consentTimestamp: string;
  lastActiveAt: string | null;
  createdAt: string;
}

export { evaluateEligibility } from "./eligibility";
export type { EligibilityResult, EligibilityOptions } from "./eligibility";
