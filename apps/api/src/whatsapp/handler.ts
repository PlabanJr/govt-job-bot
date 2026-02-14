import type { Job, UserProfile } from "@govt-jobs/shared";
import { buildDigest } from "../digest/builder";
import { query } from "../db/pool";
import { sendListMessage, sendReplyButtons, sendTextMessage } from "./client";

type Language = "en" | "hi";
type Frequency = "daily" | "weekly";
type OnboardingMode = "new" | "preferences";

interface IncomingMessage {
  from: string;
  text: string;
  messageId?: string;
}

interface OnboardingRow {
  phone: string;
  step: string;
  mode: OnboardingMode;
  data: Record<string, unknown>;
}

interface DbUser {
  id: string;
  phone: string;
  name: string;
  dob: string;
  highest_qualification: string;
  category: string;
  pwd_status: boolean;
  ex_serviceman: boolean;
  gender: string | null;
  location_preference: string | null;
  language: Language;
  frequency: Frequency;
  timezone: string;
  consent_status: "opt_in" | "opt_out";
  consent_timestamp: string;
  last_active_at: string | null;
  created_at: string;
}

const MESSAGES = {
  en: {
    consent:
      "Do you want central government job alerts on WhatsApp? Reply YES to opt in. You can reply STOP anytime to opt out.",
    language: "Choose language: Reply 1 for English, 2 for हिंदी.",
    frequency: "How often do you want alerts? Reply 1 for Daily, 2 for Weekly.",
    name: "Please share your full name.",
    dob: "Please share your date of birth (DD-MM-YYYY).",
    qualification: "What is your highest qualification? (e.g., 12th, Diploma, B.A., B.Tech, M.A., M.Sc)",
    category: "Select your category: GEN, EWS, OBC, SC, ST.",
    pwd: "Are you a person with disability (PwD)? Reply YES or NO.",
    exServiceman: "Are you an ex-serviceman? Reply YES or NO.",
    gender: "Share your gender (optional). Reply SKIP to skip.",
    location: "Share your location preference (optional). Reply SKIP to skip.",
    confirmation:
      "Thanks! You are subscribed to {frequency} central government job alerts in {language}. We only send official sources.",
    optOut: "You have been opted out. Reply START to re-subscribe.",
    preferencesHint: "Reply PREFERENCES anytime to update language, frequency, or profile.",
    alreadySubscribed:
      "You're already subscribed. Reply PREFERENCES to update language, frequency, or profile, or STOP to opt out.",
    noJobs:
      "We couldn't find any matching jobs right now. We'll send updates when new jobs are available."
  },
  hi: {
    consent:
      "क्या आप WhatsApp पर केंद्र सरकार की नौकरी की सूचनाएँ चाहते हैं? Opt in के लिए YES लिखें। कभी भी STOP लिखकर opt out कर सकते हैं।",
    language: "भाषा चुनें: English के लिए 1, हिंदी के लिए 2 लिखें।",
    frequency: "आप कितनी बार अलर्ट चाहते हैं? Daily के लिए 1, Weekly के लिए 2 लिखें।",
    name: "कृपया अपना पूरा नाम लिखें।",
    dob: "कृपया अपनी जन्मतिथि लिखें (DD-MM-YYYY)।",
    qualification: "आपकी सर्वोच्च योग्यता क्या है? (उदाहरण: 12th, Diploma, B.A., B.Tech, M.A., M.Sc)",
    category: "अपनी श्रेणी चुनें: GEN, EWS, OBC, SC, ST।",
    pwd: "क्या आप दिव्यांग (PwD) हैं? YES या NO लिखें।",
    exServiceman: "क्या आप पूर्व सैनिक हैं? YES या NO लिखें।",
    gender: "लिंग बताएं (वैकल्पिक)। SKIP लिखकर छोड़ सकते हैं।",
    location: "लोकेशन वरीयता बताएं (वैकल्पिक)। SKIP लिखकर छोड़ सकते हैं।",
    confirmation:
      "धन्यवाद! आप {language} में {frequency} केंद्रीय नौकरी अलर्ट्स के लिए सब्सक्राइब हो गए हैं। हम केवल आधिकारिक स्रोत भेजते हैं।",
    optOut: "आप opt out हो गए हैं। दोबारा सब्सक्राइब करने के लिए START लिखें।",
    preferencesHint: "भाषा, फ़्रीक्वेंसी या प्रोफ़ाइल बदलने के लिए कभी भी PREFERENCES लिखें।",
    alreadySubscribed:
      "आप पहले से सब्सक्राइब हैं। भाषा/फ़्रीक्वेंसी/प्रोफ़ाइल बदलने के लिए PREFERENCES लिखें या opt out के लिए STOP लिखें।",
    noJobs: "फिलहाल आपके प्रोफ़ाइल से मेल खाने वाली कोई नौकरियां नहीं मिलीं। हम नई नौकरियां आने पर भेजेंगे।"
  }
};

const YES = new Set(["YES", "Y"]);
const NO = new Set(["NO", "N"]);

function normalizeText(input: string) {
  const trimmed = input.trim();
  return { raw: trimmed, upper: trimmed.toUpperCase() };
}

function parseLanguage(input: string): Language | null {
  const value = input.trim().toUpperCase();
  if (value === "1" || value === "EN" || value === "ENGLISH") return "en";
  if (value === "2" || value === "HI" || value === "HINDI" || value === "हिंदी") return "hi";
  return null;
}

function parseFrequency(input: string): Frequency | null {
  const value = input.trim().toUpperCase();
  if (value === "1" || value === "DAILY") return "daily";
  if (value === "2" || value === "WEEKLY") return "weekly";
  return null;
}

function parseCategory(input: string): string | null {
  const value = input.trim().toUpperCase();
  if (["GEN", "EWS", "OBC", "SC", "ST"].includes(value)) return value;
  return null;
}

function parseYesNo(input: string): boolean | null {
  const value = input.trim().toUpperCase();
  if (YES.has(value)) return true;
  if (NO.has(value)) return false;
  return null;
}

function parseDateOfBirth(input: string): string | null {
  const match = input.trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  const now = new Date();
  if (date.getTime() > now.getTime()) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function formatConfirmation(language: Language, frequency: Frequency) {
  const langLabel = language === "en" ? "English" : "हिंदी";
  const freqLabel = frequency === "daily" ? "Daily" : "Weekly";
  return MESSAGES[language].confirmation
    .replace("{language}", langLabel)
    .replace("{frequency}", freqLabel);
}

function normalizeDateOnly(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeDateTime(value: unknown): string {
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function formatDigestMessage(language: Language, items: { title: string; lastDate: string | null; sourceUrl: string; sourcePdfUrl: string | null }[]) {
  if (items.length === 0) {
    return MESSAGES[language].noJobs;
  }

  const header =
    language === "hi"
      ? "आपके लिए कुछ संभावित नौकरियां:"
      : "Here are some jobs you may be eligible for:";

  const lines = items.map((item, index) => {
    const lastDate = item.lastDate ?? (language === "hi" ? "आधिकारिक नोटिस देखें" : "See official notice");
    const base = `${index + 1}. ${item.title}\n${language === "hi" ? "अंतिम तिथि" : "Last date"}: ${lastDate}\n${language === "hi" ? "आवेदन" : "Apply"}: ${item.sourceUrl}`;
    if (item.sourcePdfUrl) {
      return `${base}\nPDF: ${item.sourcePdfUrl}`;
    }
    return base;
  });

  return [header, ...lines].join("\n\n");
}

async function getUser(phone: string) {
  const rows = await query<DbUser>(
    `SELECT
      id,
      phone,
      name,
      dob,
      highest_qualification,
      category,
      pwd_status,
      ex_serviceman,
      gender,
      location_preference,
      language,
      frequency,
      timezone,
      consent_status,
      consent_timestamp,
      last_active_at,
      created_at
    FROM users
    WHERE phone = $1`,
    [phone]
  );
  return rows[0] ?? null;
}

async function fetchActiveJobs(limit = 12): Promise<Job[]> {
  const rows = await query<{
    id: string;
    organization: string;
    post_title: string;
    vacancies_count: number | null;
    pay_level: string | null;
    location: string | null;
    eligibility_education: string[];
    eligibility_age_min: number | null;
    eligibility_age_max: number | null;
    eligibility_category_relaxations: Record<string, number> | null;
    eligibility_pwd: boolean | null;
    eligibility_ex_serviceman: boolean | null;
    eligibility_gender: string | null;
    application_start_date: string | Date | null;
    application_end_date: string | Date | null;
    source_url: string;
    source_pdf_url: string | null;
    source_hash: string;
    created_at: string | Date;
    last_seen_at: string | Date;
  }>(
    `SELECT
      id,
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
      created_at,
      last_seen_at
     FROM jobs
     WHERE application_end_date IS NULL OR application_end_date >= CURRENT_DATE
     ORDER BY application_end_date NULLS LAST, last_seen_at DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((row) => ({
    id: row.id,
    organization: row.organization,
    postTitle: row.post_title,
    vacanciesCount: row.vacancies_count,
    payLevel: row.pay_level,
    location: row.location,
    eligibilityEducation: row.eligibility_education ?? [],
    eligibilityAgeMin: row.eligibility_age_min,
    eligibilityAgeMax: row.eligibility_age_max,
    eligibilityCategoryRelaxations: row.eligibility_category_relaxations,
    eligibilityPwd: row.eligibility_pwd,
    eligibilityExServiceman: row.eligibility_ex_serviceman,
    eligibilityGender: row.eligibility_gender,
    applicationStartDate: normalizeDateOnly(row.application_start_date),
    applicationEndDate: normalizeDateOnly(row.application_end_date),
    sourceUrl: row.source_url,
    sourcePdfUrl: row.source_pdf_url,
    sourceHash: row.source_hash,
    createdAt: normalizeDateTime(row.created_at),
    lastSeenAt: normalizeDateTime(row.last_seen_at)
  }));
}

async function logDelivery(userId: string, jobIds: string[], status: "sent" | "empty" | "failed") {
  await query(
    `INSERT INTO delivery_logs (user_id, job_ids, status)
     VALUES ($1, $2, $3)`,
    [userId, JSON.stringify(jobIds), status]
  );
}

async function sendInitialJobs(phone: string, user: UserProfile) {
  try {
    const jobs = await fetchActiveJobs();
    const digest = buildDigest(user, jobs, { asOfDate: new Date() });
    const message = formatDigestMessage(user.language, digest.items);
    await sendMessage(phone, message);
    const status = digest.items.length > 0 ? "sent" : "empty";
    await logDelivery(user.id, digest.items.map((item) => item.jobId), status);
  } catch (error) {
    try {
      await logDelivery(user.id, [], "failed");
    } catch (logError) {
      console.error("Failed to log delivery status", logError);
    }
    console.error("Failed to send initial jobs", error);
  }
}

async function getOnboarding(phone: string) {
  const rows = await query<OnboardingRow>(
    `SELECT phone, step, mode, data
     FROM user_onboarding
     WHERE phone = $1`,
    [phone]
  );
  return rows[0] ?? null;
}

async function upsertOnboarding(
  phone: string,
  step: string,
  mode: OnboardingMode,
  data: Record<string, unknown>
) {
  await query(
    `INSERT INTO user_onboarding (phone, step, mode, data, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (phone)
     DO UPDATE SET step = EXCLUDED.step, mode = EXCLUDED.mode, data = EXCLUDED.data, updated_at = now()`,
    [phone, step, mode, data]
  );
}

async function clearOnboarding(phone: string) {
  await query(`DELETE FROM user_onboarding WHERE phone = $1`, [phone]);
}

async function touchLastActive(phone: string) {
  await query(`UPDATE users SET last_active_at = now() WHERE phone = $1`, [phone]);
}

async function logConsent(userId: string, event: "opt_in" | "opt_out", messageId?: string) {
  await query(
    `INSERT INTO consent_logs (user_id, event, message_id)
     VALUES ($1, $2, $3)`,
    [userId, event, messageId ?? null]
  );
}

function getMessageLanguage(user: DbUser | null, onboarding: OnboardingRow | null): Language {
  if (onboarding && typeof onboarding.data.language === "string") {
    return onboarding.data.language === "hi" ? "hi" : "en";
  }
  if (user && user.language === "hi") return "hi";
  return "en";
}

async function sendMessage(to: string, text: string) {
  await sendTextMessage({ to, text });
}

async function sendChoiceButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]) {
  if (buttons.length === 0) {
    await sendMessage(to, bodyText);
    return;
  }
  await sendReplyButtons({ to, bodyText, buttons });
}

async function sendChoiceList(
  to: string,
  bodyText: string,
  buttonText: string,
  rows: { id: string; title: string; description?: string }[],
  sectionTitle = "Options"
) {
  if (rows.length === 0) {
    await sendMessage(to, bodyText);
    return;
  }
  await sendListMessage({
    to,
    bodyText,
    buttonText,
    sections: [{ title: sectionTitle, rows }]
  });
}

async function startConsent(phone: string, mode: OnboardingMode, preferredLanguage: Language) {
  await upsertOnboarding(phone, "consent", mode, {});
  await sendChoiceButtons(phone, MESSAGES[preferredLanguage].consent, [
    { id: "consent_yes", title: "YES" }
  ]);
}

async function startPreferences(phone: string, existingLanguage: Language) {
  await upsertOnboarding(phone, "language", "preferences", {});
  await sendChoiceButtons(phone, MESSAGES[existingLanguage].language, [
    { id: "lang_en", title: "English" },
    { id: "lang_hi", title: "हिंदी" }
  ]);
}

async function handleOptOut(phone: string, user: DbUser | null, messageId?: string) {
  if (user) {
    await query(
      `UPDATE users
       SET consent_status = 'opt_out',
           consent_timestamp = now(),
           last_active_at = now()
       WHERE phone = $1`,
      [phone]
    );
    await logConsent(user.id, "opt_out", messageId);
  }
  await clearOnboarding(phone);
  const lang = user?.language ?? "en";
  await sendMessage(phone, MESSAGES[lang].optOut);
}

async function finalizeProfile(
  phone: string,
  data: Record<string, unknown>,
  mode: OnboardingMode,
  existingUser: DbUser | null,
  messageId?: string
) {
  const language = data.language as Language;
  const frequency = data.frequency as Frequency;
  const name = data.name as string;
  const dob = data.dob as string;
  const qualification = data.highestQualification as string;
  const category = data.category as string;
  const pwdStatus = Boolean(data.pwdStatus);
  const exServiceman = Boolean(data.exServiceman);
  const gender = (data.gender as string | null | undefined) ?? null;
  const locationPreference = (data.locationPreference as string | null | undefined) ?? null;
  const nowIso = new Date().toISOString();

  let userId = existingUser?.id ?? "";
  if (existingUser) {
    await query(
      `UPDATE users
       SET name = $2,
           dob = $3,
           highest_qualification = $4,
           category = $5,
           pwd_status = $6,
           ex_serviceman = $7,
           gender = $8,
           location_preference = $9,
           language = $10,
           frequency = $11,
           consent_status = 'opt_in',
           consent_timestamp = now(),
           last_active_at = now()
       WHERE phone = $1`,
      [
        phone,
        name,
        dob,
        qualification,
        category,
        pwdStatus,
        exServiceman,
        gender,
        locationPreference,
        language,
        frequency
      ]
    );

    if (existingUser.consent_status === "opt_out") {
      await logConsent(existingUser.id, "opt_in", messageId);
    }
  } else {
    const rows = await query<{ id: string }>(
      `INSERT INTO users
        (phone, name, dob, highest_qualification, category, pwd_status, ex_serviceman, gender, location_preference, language, frequency, consent_status, consent_timestamp)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'opt_in', now())
       RETURNING id`,
      [
        phone,
        name,
        dob,
        qualification,
        category,
        pwdStatus,
        exServiceman,
        gender,
        locationPreference,
        language,
        frequency
      ]
    );
    const newUserId = rows[0]?.id;
    userId = newUserId ?? "";
    if (newUserId) {
      await logConsent(newUserId, "opt_in", messageId);
    }
  }

  await clearOnboarding(phone);
  await sendMessage(phone, formatConfirmation(language, frequency));
  if (mode === "new") {
    await sendMessage(phone, MESSAGES[language].preferencesHint);
  }

  const userProfile: UserProfile = {
    id: userId,
    phone,
    name,
    dob,
    highestQualification: qualification,
    category: category as UserProfile["category"],
    pwdStatus,
    exServiceman,
    gender,
    locationPreference,
    language,
    frequency,
    timezone: existingUser?.timezone ?? "Asia/Kolkata",
    consentStatus: "opt_in",
    consentTimestamp: nowIso,
    lastActiveAt: existingUser?.last_active_at ?? null,
    createdAt: existingUser?.created_at ?? nowIso
  };

  if (userId) {
    await sendInitialJobs(phone, userProfile);
  }
}

async function handleOnboardingStep(
  message: IncomingMessage,
  onboarding: OnboardingRow,
  existingUser: DbUser | null
) {
  const { raw, upper } = normalizeText(message.text);
  const language = getMessageLanguage(existingUser, onboarding);
  const data = { ...(onboarding.data ?? {}) } as Record<string, unknown>;
  const mode = onboarding.mode;

  if (onboarding.step === "consent") {
    if (YES.has(upper)) {
      data.consentGrantedAt = new Date().toISOString();
      await upsertOnboarding(message.from, "language", mode, data);
      await sendChoiceButtons(message.from, MESSAGES[language].language, [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" }
      ]);
      return;
    }
    await sendChoiceButtons(message.from, MESSAGES[language].consent, [
      { id: "consent_yes", title: "YES" }
    ]);
    return;
  }

  if (onboarding.step === "language") {
    const lang = parseLanguage(raw);
    if (!lang) {
      await sendChoiceButtons(message.from, MESSAGES[language].language, [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" }
      ]);
      return;
    }
    data.language = lang;
    await upsertOnboarding(message.from, "frequency", mode, data);
    await sendChoiceButtons(message.from, MESSAGES[lang].frequency, [
      { id: "freq_daily", title: "Daily" },
      { id: "freq_weekly", title: "Weekly" }
    ]);
    return;
  }

  if (onboarding.step === "frequency") {
    const freq = parseFrequency(raw);
    if (!freq) {
      await sendChoiceButtons(message.from, MESSAGES[language].frequency, [
        { id: "freq_daily", title: "Daily" },
        { id: "freq_weekly", title: "Weekly" }
      ]);
      return;
    }
    data.frequency = freq;
    await upsertOnboarding(message.from, "name", mode, data);
    await sendMessage(message.from, MESSAGES[language].name);
    return;
  }

  if (onboarding.step === "name") {
    if (!raw) {
      await sendMessage(message.from, MESSAGES[language].name);
      return;
    }
    data.name = raw;
    await upsertOnboarding(message.from, "dob", mode, data);
    await sendMessage(message.from, MESSAGES[language].dob);
    return;
  }

  if (onboarding.step === "dob") {
    const dob = parseDateOfBirth(raw);
    if (!dob) {
      await sendMessage(message.from, MESSAGES[language].dob);
      return;
    }
    data.dob = dob;
    await upsertOnboarding(message.from, "qualification", mode, data);
    await sendMessage(message.from, MESSAGES[language].qualification);
    return;
  }

  if (onboarding.step === "qualification") {
    if (!raw) {
      await sendMessage(message.from, MESSAGES[language].qualification);
      return;
    }
    data.highestQualification = raw;
    await upsertOnboarding(message.from, "category", mode, data);
    await sendMessage(message.from, MESSAGES[language].category);
    return;
  }

  if (onboarding.step === "category") {
    const category = parseCategory(raw);
    if (!category) {
      await sendChoiceList(
        message.from,
        MESSAGES[language].category,
        language === "hi" ? "श्रेणी चुनें" : "Pick category",
        [
          { id: "cat_gen", title: "GEN" },
          { id: "cat_ews", title: "EWS" },
          { id: "cat_obc", title: "OBC" },
          { id: "cat_sc", title: "SC" },
          { id: "cat_st", title: "ST" }
        ],
        language === "hi" ? "Categories" : "Categories"
      );
      return;
    }
    data.category = category;
    await upsertOnboarding(message.from, "pwd", mode, data);
    await sendChoiceButtons(message.from, MESSAGES[language].pwd, [
      { id: "pwd_yes", title: "YES" },
      { id: "pwd_no", title: "NO" }
    ]);
    return;
  }

  if (onboarding.step === "pwd") {
    const value = parseYesNo(raw);
    if (value === null) {
      await sendChoiceButtons(message.from, MESSAGES[language].pwd, [
        { id: "pwd_yes", title: "YES" },
        { id: "pwd_no", title: "NO" }
      ]);
      return;
    }
    data.pwdStatus = value;
    await upsertOnboarding(message.from, "ex_serviceman", mode, data);
    await sendChoiceButtons(message.from, MESSAGES[language].exServiceman, [
      { id: "ex_yes", title: "YES" },
      { id: "ex_no", title: "NO" }
    ]);
    return;
  }

  if (onboarding.step === "ex_serviceman") {
    const value = parseYesNo(raw);
    if (value === null) {
      await sendChoiceButtons(message.from, MESSAGES[language].exServiceman, [
        { id: "ex_yes", title: "YES" },
        { id: "ex_no", title: "NO" }
      ]);
      return;
    }
    data.exServiceman = value;
    await upsertOnboarding(message.from, "gender", mode, data);
    await sendChoiceList(
      message.from,
      MESSAGES[language].gender,
      language === "hi" ? "लिंग चुनें" : "Pick gender",
      [
        { id: "gender_male", title: "Male" },
        { id: "gender_female", title: "Female" },
        { id: "gender_other", title: "Other" },
        { id: "gender_skip", title: "SKIP" }
      ],
      language === "hi" ? "Gender" : "Gender"
    );
    return;
  }

  if (onboarding.step === "gender") {
    if (upper === "SKIP") {
      data.gender = null;
    } else if (!raw) {
      await sendChoiceList(
        message.from,
        MESSAGES[language].gender,
        language === "hi" ? "लिंग चुनें" : "Pick gender",
        [
          { id: "gender_male", title: "Male" },
          { id: "gender_female", title: "Female" },
          { id: "gender_other", title: "Other" },
          { id: "gender_skip", title: "SKIP" }
        ],
        language === "hi" ? "Gender" : "Gender"
      );
      return;
    } else {
      data.gender = raw;
    }
    await upsertOnboarding(message.from, "location", mode, data);
    await sendChoiceButtons(message.from, MESSAGES[language].location, [
      { id: "location_skip", title: "SKIP" }
    ]);
    return;
  }

  if (onboarding.step === "location") {
    if (upper === "SKIP") {
      data.locationPreference = null;
    } else if (!raw) {
      await sendChoiceButtons(message.from, MESSAGES[language].location, [
        { id: "location_skip", title: "SKIP" }
      ]);
      return;
    } else {
      data.locationPreference = raw;
    }
    await finalizeProfile(message.from, data, mode, existingUser, message.messageId);
  }
}

async function handleMessage(message: IncomingMessage) {
  const { raw, upper } = normalizeText(message.text);
  const phone = message.from;
  const existingUser = await getUser(phone);

  if (upper === "STOP") {
    await handleOptOut(phone, existingUser, message.messageId);
    return;
  }

  const onboarding = await getOnboarding(phone);

  if (!onboarding) {
    if (existingUser && existingUser.consent_status === "opt_in") {
      if (upper === "PREFERENCES") {
        await startPreferences(phone, existingUser.language);
        await touchLastActive(phone);
        return;
      }
      await sendMessage(phone, MESSAGES[existingUser.language].alreadySubscribed);
      await touchLastActive(phone);
      return;
    }

    if (upper === "YES") {
      await upsertOnboarding(phone, "language", "new", { consentGrantedAt: new Date().toISOString() });
      const preferredLanguage = existingUser?.language ?? "en";
      await sendChoiceButtons(phone, MESSAGES[preferredLanguage].language, [
        { id: "lang_en", title: "English" },
        { id: "lang_hi", title: "हिंदी" }
      ]);
      return;
    }

    const preferredLanguage = existingUser?.language ?? "en";
    await startConsent(phone, "new", preferredLanguage);
    return;
  }

  if (upper === "PREFERENCES" && existingUser) {
    await startPreferences(phone, existingUser.language);
    await touchLastActive(phone);
    return;
  }

  await handleOnboardingStep(message, onboarding, existingUser);
  await touchLastActive(phone);
}

export function extractIncomingMessages(payload: Record<string, unknown>): IncomingMessage[] {
  const messages: IncomingMessage[] = [];
  const root = payload as {
    entry?: unknown;
  };
  const entries = Array.isArray(root.entry) ? root.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray((entry as any)?.changes) ? (entry as any).changes : [];
    for (const change of changes) {
      const value = (change as any)?.value ?? {};
      const msgList = Array.isArray(value?.messages) ? value.messages : [];
      for (const msg of msgList) {
        const from = typeof msg?.from === "string" ? msg.from : null;
        const text =
          msg?.text?.body ??
          msg?.button?.text ??
          msg?.interactive?.button_reply?.title ??
          msg?.interactive?.list_reply?.title ??
          null;
        if (!from || typeof text !== "string") continue;
        messages.push({
          from,
          text,
          messageId: typeof msg?.id === "string" ? msg.id : undefined
        });
      }
    }
  }
  return messages;
}

export async function handleIncomingPayload(payload: Record<string, unknown>) {
  const messages = extractIncomingMessages(payload);
  for (const message of messages) {
    await handleMessage(message);
  }
}
