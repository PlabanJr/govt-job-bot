import * as cheerio from "cheerio";
import type { IngestedJob, SourceDefinition } from "../types";
import { cleanText, resolveUrl } from "./utils";

export const indiaPostVacanciesSource: SourceDefinition = {
  id: "india-post-vacancies",
  name: "India Post Vacancies",
  listUrl: "https://www.indiapost.gov.in/vacancies",
  enabled: true,
  parse: (html, baseUrl) => {
    const $ = cheerio.load(html);
    const rows = $("table tbody tr");
    const jobs: IngestedJob[] = [];

    rows.each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length === 0) return;

      const title = cleanText($(cells[0]).text()) || cleanText($(row).find("a").first().text());
      const link = resolveUrl(baseUrl, $(row).find("a").first().attr("href"));

      if (!title || !link) return;

      jobs.push({
        organization: "India Post",
        postTitle: title,
        vacanciesCount: null,
        payLevel: null,
        location: null,
        eligibilityEducation: [],
        eligibilityAgeMin: null,
        eligibilityAgeMax: null,
        eligibilityCategoryRelaxations: null,
        eligibilityPwd: null,
        eligibilityExServiceman: null,
        eligibilityGender: null,
        applicationStartDate: null,
        applicationEndDate: null,
        sourceUrl: link,
        sourcePdfUrl: link
      });
    });

    return jobs;
  }
};
