import * as cheerio from "cheerio";
import type { IngestedJob, SourceDefinition } from "../types";
import { cleanText, resolveUrl } from "./utils";

export const rrbNoticesSource: SourceDefinition = {
  id: "rrb-employment-notices",
  name: "RRB Employment Notices",
  listUrl: "https://www.rrbcdg.gov.in/employment-notices.php",
  enabled: true,
  parse: (html, baseUrl) => {
    const $ = cheerio.load(html);
    const rows = $("table tbody tr");
    const jobs: IngestedJob[] = [];

    rows.each((_, row) => {
      const link = resolveUrl(baseUrl, $(row).find("a").first().attr("href"));
      const title = cleanText($(row).find("a").first().text())
        || cleanText($(row).text());

      if (!link || !title) return;

      jobs.push({
        organization: "Railway Recruitment Board",
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
