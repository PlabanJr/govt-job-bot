import type { SourceDefinition } from "../types";
import { upscNoticesSource } from "./upsc";
import { sscNoticesSource } from "./ssc";
import { rrbNoticesSource } from "./rrb";
import { indiaPostVacanciesSource } from "./indiapost";

export const sources: SourceDefinition[] = [
  upscNoticesSource,
  sscNoticesSource,
  rrbNoticesSource,
  indiaPostVacanciesSource
];
