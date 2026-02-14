import { runAllSources } from "./runner";

async function main() {
  const results = await runAllSources();
  const hasErrors = results.some((result) => result.error);
  console.log(JSON.stringify({ status: hasErrors ? "partial" : "ok", results }, null, 2));
  if (hasErrors) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
