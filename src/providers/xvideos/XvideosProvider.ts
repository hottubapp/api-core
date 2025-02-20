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

  public async getVideos(options: SearchOptions): Promise<VideoResult> {
    const url = this.buildUrl(options);

    console.log("XVideos url", url);

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

    const page = options?.page || 1;
    const pageParam = `p=${page}`;

    // Handle sort option
    const sortValue = options.sort;
    const sortParam =
      typeof sortValue === "string" && sortValue in SORT_OPTIONS
        ? SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS].value
        : "";

    return `${this.baseUrl}/?k=${encodeURIComponent(options.query)}&${pageParam}${sortParam ? "&" + sortParam : ""}`;
  }

  private buildPopularUrl(options: SearchOptions): string {
    const page = options?.page || 1;
    let path = options.sort == "new" ? "new" : "best";
    return `${this.baseUrl}/${path}/${page}`;
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
        const viewsText = $metadata.text();
        const views = this.parseViews(viewsText);

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
    let totalSeconds = 0;

    for (let i = 0; i < parts.length; i += 2) {
      const value = parseInt(parts[i], 10);
      if (parts[i + 1] === "h") {
        totalSeconds += value * 3600; // Convert hours to seconds
      } else if (parts[i + 1] === "min") {
        totalSeconds += value * 60; // Convert minutes to seconds
      }
    }

    return totalSeconds;
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
