import { fetchHtml } from "./fetch";
import { normalizeJob } from "./normalize";
import { sources } from "./sources";
import { ensureSource, startRun, completeRun, failRun } from "./logs";
import { upsertJob } from "./store";
import type { IngestionResult, SourceDefinition } from "./types";

export async function runSource(source: SourceDefinition): Promise<IngestionResult> {
  await ensureSource(source);
  const runId = await startRun(source.id);

  try {
    const html = await fetchHtml(source.listUrl);
    const parsed = source.parse(html, source.listUrl).map(normalizeJob);

    let itemsNew = 0;
    let itemsUpdated = 0;

    for (const job of parsed) {
      const result = await upsertJob(job);
      if (result.inserted) {
        itemsNew += 1;
      } else {
        itemsUpdated += 1;
      }
    }

    const result = {
      sourceId: source.id,
      itemsFound: parsed.length,
      itemsNew,
      itemsUpdated
    };

    if (runId) {
      await completeRun(runId, result);
    }

    return result;
  } catch (error) {
    await failRun(runId, source.id, error);
    throw error;
  }
}

export async function runAllSources() {
  const results: IngestionResult[] = [];

  for (const source of sources.filter((s) => s.enabled)) {
    try {
      const result = await runSource(source);
      results.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({
        sourceId: source.id,
        itemsFound: 0,
        itemsNew: 0,
        itemsUpdated: 0,
        error: message
      });
    }
  }

  return results;
}
