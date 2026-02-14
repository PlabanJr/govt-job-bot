import * as cheerio from "cheerio";
import type { IngestedJob, SourceDefinition } from "../types";
import { cleanText, resolveUrl } from "./utils";

export const sscNoticesSource: SourceDefinition = {
  id: "ssc-notices",
  name: "SSC Notices",
  listUrl: "https://ssc.nic.in/Portal/Notices",
  enabled: true,
  parse: (html, baseUrl) => {
    const $ = cheerio.load(html);
    const rows = $("table tbody tr");
    const jobs: IngestedJob[] = [];

    rows.each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const name = cleanText($(cells[1]).text()) || cleanText($(cells[0]).text());
      const noticeLink = resolveUrl(baseUrl, $(cells[2]).find("a").attr("href"))
        ?? resolveUrl(baseUrl, $(row).find("a").first().attr("href"));

      if (!name || !noticeLink) return;

      jobs.push({
        organization: "SSC",
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
        sourceUrl: noticeLink,
        sourcePdfUrl: noticeLink
      });
    });

    return jobs;
  }
};
