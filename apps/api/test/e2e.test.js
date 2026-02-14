const test = require("node:test");
const assert = require("node:assert/strict");

const { buildDigest } = require("../dist/digest/builder.js");
const { createMockSender } = require("../dist/whatsapp/mock.js");

const baseJob = {
  id: "job-1",
  organization: "UPSC",
  postTitle: "Assistant",
  vacanciesCount: null,
  payLevel: null,
  location: null,
  eligibilityEducation: ["B.A."],
  eligibilityAgeMin: 18,
  eligibilityAgeMax: 28,
  eligibilityCategoryRelaxations: { OBC: 3 },
  eligibilityPwd: null,
  eligibilityExServiceman: null,
  eligibilityGender: null,
  applicationStartDate: "2026-02-01",
  applicationEndDate: "2026-03-01",
  sourceUrl: "https://upsc.gov.in/notice",
  sourcePdfUrl: "https://upsc.gov.in/notice.pdf",
  sourceHash: "hash",
  createdAt: "2026-02-01T00:00:00Z",
  lastSeenAt: "2026-02-01T00:00:00Z"
};

const baseUser = {
  id: "user-1",
  phone: "+910000000000",
  name: "User",
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

test("ingest → eligibility → digest → whatsapp mock", async () => {
  const digest = buildDigest(baseUser, [baseJob], { asOfDate: new Date("2026-02-15") });
  assert.equal(digest.items.length, 1);

  const collected = [];
  const sender = createMockSender(collected);
  await sender.sendDigest(baseUser.phone, digest);

  assert.equal(collected.length, 1);
  assert.equal(collected[0].to, baseUser.phone);
  assert.equal(collected[0].payload.items[0].title, "UPSC — Assistant");
});
