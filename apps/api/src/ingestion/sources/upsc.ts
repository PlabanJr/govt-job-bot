import * as cheerio from "cheerio";
import type { IngestedJob, SourceDefinition } from "../types";
import { cleanText, resolveUrl } from "./utils";

export const upscNoticesSource: SourceDefinition = {
  id: "upsc-notices",
  name: "UPSC Recruitment Notices",
  listUrl: "https://upsc.gov.in/recruitment/status-recruitment-cases-advertisementwise/notices",
  enabled: true,
  parse: (html, baseUrl) => {
    const $ = cheerio.load(html);
    const rows = $("table tbody tr");
    const jobs: IngestedJob[] = [];

    rows.each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      const name = cleanText($(cells[2]).text());
      const docLink = resolveUrl(baseUrl, $(cells[3]).find("a").attr("href"))
        ?? resolveUrl(baseUrl, $(cells[2]).find("a").attr("href"));

      if (!name || !docLink) return;

      jobs.push({
        organization: "UPSC",
        postTitle: name,
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
        sourceUrl: docLink,
        sourcePdfUrl: docLink
      });
    });

    return jobs;
  }
};
