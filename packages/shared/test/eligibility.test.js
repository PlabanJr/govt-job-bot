const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateEligibility } = require("../dist/eligibility.js");

const baseJob = {
  id: "job-1",
  organization: "Ministry",
  postTitle: "Clerk",
  vacanciesCount: 10,
  payLevel: null,
  location: null,
  eligibilityEducation: ["B.A."],
  eligibilityAgeMin: 18,
  eligibilityAgeMax: 27,
  eligibilityCategoryRelaxations: { OBC: 3, SC: 5, ST: 5, PWD: 10 },
  eligibilityPwd: null,
  eligibilityExServiceman: null,
  eligibilityGender: null,
  applicationStartDate: "2026-02-01",
  applicationEndDate: "2026-03-01",
  sourceUrl: "https://example.gov/job",
  sourcePdfUrl: null,
  sourceHash: "abc",
  createdAt: "2026-02-01T00:00:00Z",
  lastSeenAt: "2026-02-01T00:00:00Z"
};

const baseUser = {
  id: "user-1",
  phone: "+910000000000",
  name: "Test User",
  dob: "2000-02-01",
  highestQualification: "B.A.",
  category: "GEN",
  pwdStatus: false,
  exServiceman: false,
  gender: null,
  language: "en",
  frequency: "daily",
  timezone: "Asia/Kolkata",
  consentStatus: "opt_in",
  consentTimestamp: "2026-02-01T00:00:00Z",
  lastActiveAt: null,
  createdAt: "2026-02-01T00:00:00Z"
};

test("eligible when age and qualification match", () => {
  const result = evaluateEligibility(baseJob, baseUser, { asOfDate: new Date("2026-02-15") });
  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test("rejects when above max age without relaxation", () => {
  const olderUser = { ...baseUser, dob: "1980-02-01" };
  const result = evaluateEligibility(baseJob, olderUser, { asOfDate: new Date("2026-02-15") });
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes("Above maximum age"));
});

test("allows age relaxation for category", () => {
  const olderUser = { ...baseUser, dob: "1985-02-01", category: "OBC" };
  const relaxedJob = { ...baseJob, eligibilityAgeMax: 40 };
  const result = evaluateEligibility(relaxedJob, olderUser, { asOfDate: new Date("2026-02-15") });
  assert.equal(result.eligible, true);
});

test("rejects qualification mismatch", () => {
  const user = { ...baseUser, highestQualification: "B.Tech" };
  const result = evaluateEligibility(baseJob, user, { asOfDate: new Date("2026-02-15") });
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes("Qualification mismatch"));
});

test("requires gender only when job specifies", () => {
  const genderedJob = { ...baseJob, eligibilityGender: "Female" };
  const missingGender = { ...baseUser, gender: null };
  const mismatchGender = { ...baseUser, gender: "Male" };

  const missing = evaluateEligibility(genderedJob, missingGender, { asOfDate: new Date("2026-02-15") });
  const mismatch = evaluateEligibility(genderedJob, mismatchGender, { asOfDate: new Date("2026-02-15") });

  assert.equal(missing.eligible, false);
  assert.ok(missing.reasons.includes("Gender required"));
  assert.equal(mismatch.eligible, false);
  assert.ok(mismatch.reasons.includes("Gender mismatch"));
});
