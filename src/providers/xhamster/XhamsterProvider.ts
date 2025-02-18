import axios from "axios";

import cloudscraper from "cloudscraper";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { ContentProvider, VideoResult } from "@/types";
import { Video } from "@/models/Video";
import { SearchOptions } from "@/models/SearchOptions";
import { XHAMSTER_CHANNEL, SORT_OPTIONS } from "./XhamsterChannel";

export default class XhamsterProvider implements ContentProvider {
  readonly channel = XHAMSTER_CHANNEL;
  private readonly baseUrl = "https://xhamster.com";

  public async getVideos(options: SearchOptions): Promise<VideoResult> {
    const url = this.buildUrl(options);

    try {
      const response = await cloudscraper.get(url, {
        headers: {
          Cookie: "parental-control=yes;",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.toString());
      const videos = this.parseVideos($);

      // XHamster typically shows 36 videos per page
      const hasMore = $(".thumb-list__item.video-thumb").length === 36;

      return {
        videos,
        totalResults: -1, // XHamster doesn't provide total count
        hasNextPage: hasMore,
      };
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos due to Cloudflare protection");
    }
  }

  private buildUrl(options: SearchOptions): string {
    if (!options.query) {
      return this.buildPopularUrl(options);
    }

    const page = options?.page || 1;
    const params = new URLSearchParams();
    params.set("k", encodeURIComponent(options.query));
    params.set("p", String(Math.max(0, page - 1)));

    // Handle sort option
    const sortValue = options.filters?.sort;
    if (typeof sortValue === "string" && sortValue in SORT_OPTIONS) {
      params.set(SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS].id, "");
    }

    return `${this.baseUrl}/?${params.toString()}`;
  }

  private buildPopularUrl(options: SearchOptions): string {
    const page = options?.page || 1;
    return `${this.baseUrl}/${page}`;
  }

  private parseVideos($: CheerioAPI): Video[] {
    const results: Video[] = [];

    $(".thumb-list__item.video-thumb").each((_, element) => {
      try {
        const $el = $(element);

        // Skip live videos
        if ($el.find(".live-badge").length > 0) {
          return;
        }

        // Title and URL
        const $titleEl = $el.find(".video-thumb-info__name");
        const title = $titleEl.text().trim();
        const url = $titleEl.attr("href") || "";

        // Thumbnail
        const thumb = $el.find(".thumb-image-container__image").attr("src") || "";

        // Duration - updated selector
        const duration = this.parseDuration(
          $el.find(".thumb-image-container__duration [data-role='video-duration'] .tiny-8643e").text().trim()
        );

        // Views
        const views = this.parseViews($el.find(".video-thumb-views").text().trim());

        // Uploader info
        const $uploaderEl = $el.find(".video-uploader__name");
        const uploader = $uploaderEl.text().trim() || undefined;
        const uploaderUrl = $uploaderEl.attr("href") || undefined;
        const verified = false; // XHamster doesn't show verified status in search results

        results.push(
          new Video({
            displayId: url.split("/").pop() || "",
            title,
            url: url.startsWith("http") ? url : `${this.baseUrl}${url}`,
            duration,
            views,
            channel: this.channel.id,
            thumb,
            uploader,
            uploaderUrl: uploaderUrl
              ? uploaderUrl.startsWith("http")
                ? uploaderUrl
                : `${this.baseUrl}${uploaderUrl}`
              : undefined,
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
    if (!duration) return 0;

    const parts = duration.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    if (parts.length === 3) {
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
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
