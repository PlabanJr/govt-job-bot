import type { Job, UserProfile } from "./index";

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export interface EligibilityOptions {
  asOfDate?: Date;
}

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\./g, "");

const getAgeInYears = (dob: Date, asOf: Date) => {
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

const getRelaxationYears = (job: Job, user: UserProfile) => {
  if (!job.eligibilityCategoryRelaxations) return 0;

  const relaxations = job.eligibilityCategoryRelaxations;
  const categoryKey = user.category;
  const categoryRelaxation =
    relaxations[categoryKey] ??
    relaxations[categoryKey.toLowerCase()] ??
    0;

  const pwdRelaxationKey = Object.keys(relaxations).find(
    (key) => normalizeText(key) === "pwd"
  );
  const exRelaxationKey = Object.keys(relaxations).find(
    (key) => normalizeText(key) === "exserviceman" || normalizeText(key) === "ex-serviceman"
  );

  const pwdRelaxation = user.pwdStatus && pwdRelaxationKey ? relaxations[pwdRelaxationKey] ?? 0 : 0;
  const exRelaxation =
    user.exServiceman && exRelaxationKey ? relaxations[exRelaxationKey] ?? 0 : 0;

  return Math.max(categoryRelaxation, pwdRelaxation, exRelaxation, 0);
};

const qualificationMatches = (jobQualifications: string[], userQualification: string) => {
  if (jobQualifications.length === 0) return true;

  const normalizedUser = normalizeText(userQualification);
  return jobQualifications.some((qualification) =>
    normalizeText(qualification) === normalizedUser
  );
};

export function evaluateEligibility(job: Job, user: UserProfile, options: EligibilityOptions = {}): EligibilityResult {
  const reasons: string[] = [];

  const now = options.asOfDate ?? new Date();
  const dateString = job.applicationEndDate ?? job.applicationStartDate ?? null;
  const asOfDate = dateString ? new Date(dateString) : now;

  if (Number.isNaN(asOfDate.getTime())) {
    reasons.push("Invalid application date");
  }

  const ageMin = job.eligibilityAgeMin;
  const ageMax = job.eligibilityAgeMax;
  if (ageMin !== null || ageMax !== null) {
    const dob = new Date(user.dob);
    if (Number.isNaN(dob.getTime())) {
      reasons.push("Invalid date of birth");
    } else {
      const relaxationYears = getRelaxationYears(job, user);
      const age = getAgeInYears(dob, asOfDate);

      if (ageMin !== null && age < ageMin) {
        reasons.push("Below minimum age");
      }

      if (ageMax !== null && age > ageMax + relaxationYears) {
        reasons.push("Above maximum age");
      }
    }
  }

  if (!qualificationMatches(job.eligibilityEducation, user.highestQualification)) {
    reasons.push("Qualification mismatch");
  }

  if (job.eligibilityPwd === true && !user.pwdStatus) {
    reasons.push("PwD required");
  }

  if (job.eligibilityExServiceman === true && !user.exServiceman) {
    reasons.push("Ex-serviceman required");
  }

  if (job.eligibilityGender) {
    if (!user.gender) {
      reasons.push("Gender required");
    } else if (normalizeText(user.gender) !== normalizeText(job.eligibilityGender)) {
      reasons.push("Gender mismatch");
    }
  }

  return { eligible: reasons.length === 0, reasons };
}
