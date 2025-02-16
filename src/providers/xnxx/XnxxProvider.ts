import axios from "axios";

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { ContentProvider, VideoResult } from "@/types";
import { Video } from "@/models/Video";
import { SearchOptions } from "@/models/SearchOptions";
import { XNXX_CHANNEL, SORT_OPTIONS } from "./XnxxChannel";

export default class XnxxProvider implements ContentProvider {
  readonly channel = XNXX_CHANNEL;
  private readonly baseUrl = "https://www.xnxx.com";

  public async getVideos(options: SearchOptions): Promise<VideoResult> {
    const url = this.buildUrl(options);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const videos = this.parseVideos($);

    // XNXX shows 32 videos per page
    const currentPage = options?.page || 1;
    const hasMore = $("#content .mozaique .thumb-block").length === 32;

    return {
      videos,
      totalResults: -1, // XNXX doesn't provide total count
      hasNextPage: hasMore,
    };
  }

  private buildUrl(options: SearchOptions): string {
    if (!options.query) {
      return this.buildPopularUrl(options);
    }

    const page = options?.page || 1;
    const pageParam = page > 1 ? `/${page - 1}` : "";

    // Handle sort option
    const sortValue = options.filters?.sort;
    const sortParam =
      typeof sortValue === "string" && sortValue in SORT_OPTIONS
        ? SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS].value
        : "";

    return `${this.baseUrl}/search/${encodeURIComponent(options.query)}${pageParam}${
      sortParam ? "?" + sortParam : ""
    }`;
  }

  private buildPopularUrl(options: SearchOptions): string {
    const date = new Date();
    let year = date.getFullYear();
    const page = options?.page || 1;
    let monthOffset = date.getMonth() + 1 - (page - 1);

    // If it's the first of the month, use previous month
    if (date.getDate() === 1) {
      monthOffset--;
    }

    // Adjust year when months go negative
    while (monthOffset <= 0) {
      year--;
      monthOffset += 12;
    }

    const month = monthOffset.toString().padStart(2, "0");
    return `${this.baseUrl}/best/${year}-${month}`;
  }

  private parseVideos($: CheerioAPI): Video[] {
    const results: Video[] = [];

    $("#content .mozaique .thumb-block").each((_, element) => {
      try {
        const $el = $(element);

        // Title and URL
        const $titleEl = $el.find(".thumb-under p a").first();
        const url = $titleEl.attr("href") || "";

        // Uploader info
        const $uploaderEl = $el.find(".uploader a");
        const uploader = $uploaderEl.find(".name").text().trim();
        const uploaderUrl = $uploaderEl.attr("href");

        // Thumbnail and preview
        const thumb =
          $el.find(".thumb img").attr("data-src") || $el.find(".thumb img").attr("src") || "";
        const videoId = $el.find(".thumb img").attr("data-videoid");

        // Metadata
        const $metadata = $el.find(".thumb-under p.metadata");
        const duration = this.parseDuration(
          $metadata.clone().children().remove().end().text().trim()
        );

        // Parse views - return undefined if not found
        const viewsText = $metadata.find(".right").clone().children().remove().end().text().trim();
        const views = viewsText ? this.parseViews(viewsText) : undefined;

        // Parse rating - return undefined if not found
        const ratingText = $metadata.find(".superfluous").first().text().trim();
        const rating = ratingText ? this.parseRating(ratingText) : undefined;

        results.push(
          new Video({
            displayId: videoId || url.split("/").pop() || "",
            title: $titleEl.text().trim(),
            url: `${this.baseUrl}${url}`,
            duration,
            views,
            rating,
            channel: "xnxx",
            thumb,
            uploader: uploader || undefined,
            uploaderUrl: uploaderUrl ? `${this.baseUrl}${uploaderUrl}` : undefined,
          })
        );
      } catch (error) {
        console.warn("Error parsing video:", error);
      }
    });

    return results;
  }

  private parseDuration(duration: string): number {
    return parseInt(duration) * 60; // XNXX shows duration in minutes
  }

  private parseViews(views: string): number | undefined {
    if (!views) return undefined;

    const normalized = views.toLowerCase();
    if (normalized.includes("m")) {
      return parseFloat(normalized.replace("m", "")) * 1000000;
    }
    if (normalized.includes("k")) {
      return parseFloat(normalized.replace("k", "")) * 1000;
    }
    const parsed = parseInt(normalized.replace(/[^\d.]/g, ""));
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseRating(rating: string): number | undefined {
    const parsed = parseInt(rating.replace("%", ""));
    return isNaN(parsed) ? undefined : parsed;
  }
}
