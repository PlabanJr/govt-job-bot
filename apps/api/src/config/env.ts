export interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  optionalMissing: string[];
}

const required = [
  "DATABASE_URL",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN"
];

const optional = ["WHATSAPP_API_BASE_URL", "PORT", "HOST"];

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvCheckResult {
  const missing = required.filter((key) => !env[key]);
  const optionalMissing = optional.filter((key) => !env[key]);

  return {
    ok: missing.length === 0,
    missing,
    optionalMissing
  };
}

async function main() {
  const result = checkEnv();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
