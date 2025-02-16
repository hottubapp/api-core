import axios from "axios";

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { ContentProvider, VideoResult } from "@/types";
import { Video } from "@/models/Video";
import { SearchOptions } from "@/models/SearchOptions";
import { XVIDEOS_CHANNEL, SORT_OPTIONS } from "./XvideosChannel";

export default class XvideosProvider implements ContentProvider {
  readonly channel = XVIDEOS_CHANNEL;
  private readonly baseUrl = "https://www.xvideos.com";

  async getVideos(options: SearchOptions): Promise<VideoResult> {
    const url = this.buildUrl(options);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const videos = this.parseVideos($);

    // XVideos shows 32 videos per page
    const hasMore = $("#content .mozaique .thumb-block").length === 32;

    return {
      videos,
      totalResults: -1, // XVideos doesn't provide total count
      hasNextPage: hasMore,
    };
  }

  private buildUrl(options: SearchOptions): string {
    if (!options.query) {
      return this.buildPopularUrl(options);
    }

    const page = options.pagination?.page || 1;
    const pageParam = `p=${Math.max(0, page - 1)}`;

    // Handle sort option
    const sortValue = options.filters?.sort;
    const sortParam =
      typeof sortValue === "string" && sortValue in SORT_OPTIONS
        ? SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS].value
        : "";

    return `${this.baseUrl}/?k=${encodeURIComponent(options.query)}&${pageParam}${
      sortParam ? "&" + sortParam : ""
    }`;
  }

  private buildPopularUrl(options: SearchOptions): string {
    const page = options.pagination?.page || 1;
    return `${this.baseUrl}/new/${page}`;
  }

  private parseVideos($: CheerioAPI): Video[] {
    const results: Video[] = [];

    $("#content .mozaique .thumb-block").each((_, element) => {
      try {
        const $el = $(element);

        // Title and URL
        const $titleEl = $el.find(".title a").first();
        const titleNode = $titleEl.contents().get(0);
        const title = titleNode?.type === "text" ? titleNode.data.trim() : $titleEl.text().trim();
        const url = $titleEl.attr("href") || "";

        // Thumbnail
        const thumbSrc = $el.find(".thumb img").data("src") as string | undefined;

        // prefer the highest quality thumbnail
        const thumb = thumbSrc?.replace("thumbs169/", "thumbs169lll/") || "";

        // Metadata and uploader info
        const $metadata = $el.find(".metadata > span.bg");
        const $uploaderEl = $metadata.find("span a");
        const uploader = $uploaderEl.find("span.name").text().trim() || undefined;
        const uploaderUrl = $uploaderEl.attr("href") || undefined;
        const verified = !!$uploaderEl.attr("title");

        // Duration
        const durationText = $el.find(".duration").first().text().trim();
        const duration = this.parseDuration(durationText);

        // Views - extract from metadata text
        let views: number | undefined;
        const viewsText = $metadata.text();
        // Match formats like "13 minMydirtyhobby - 2.6M Views -" or "8 minMYLF Official - 29M Views -"
        const viewsMatch = viewsText.match(/\s*-\s*(\d+\.?\d*)[kM]\s*Views/);

        if (viewsMatch) {
          const [, number] = viewsMatch;
          const value = parseFloat(number);

          if (viewsText.includes("M Views")) {
            views = value * 1000000;
          } else if (viewsText.includes("k Views")) {
            views = value * 1000;
          }
        }

        results.push(
          new Video({
            displayId: url.split("/").pop() || "",
            title,
            url: `${this.baseUrl}${url}`,
            duration,
            views,
            channel: "xvideos",
            thumb,
            uploader,
            uploaderUrl: uploaderUrl ? `${this.baseUrl}${uploaderUrl}` : undefined,
            verified,
          })
        );
      } catch (error) {
        console.warn("Error parsing video:", error);
      }
    });

    return results;
  }

  private parseDuration(duration: string): number {
    const parts = duration.split(" ");
    if (parts[1] === "min") {
      return parseInt(parts[0], 10) * 60;
    }
    return 0;
  }

  private parseViews(text: string): number | undefined {
    const match = text.match(/(\d+(\.\d+)?)([kM]?)\s*Views/);
    if (!match) return undefined;

    const [, number, , suffix] = match;
    const value = parseFloat(number);

    if (suffix === "k") return value * 1000;
    if (suffix === "M") return value * 1000000;
    return value;
  }
}
