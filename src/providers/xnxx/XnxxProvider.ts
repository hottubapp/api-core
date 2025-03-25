import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { ContentProvider, VideosResponse, VideosRequest, Video, createAxiosInstanceWithProxy } from "@hottubapp/core";
import { XNXX_CHANNEL, SORT_OPTIONS } from "./XnxxChannel";

export default class XnxxProvider implements ContentProvider {
  readonly channel = XNXX_CHANNEL;
  private readonly baseUrl = "https://www.xnxx.com";

  public async getVideos(options: VideosRequest): Promise<VideosResponse> {
    const url = this.buildUrl(options);
    console.log("🔎 [XnxxProvider] url", url);
    const response = await createAxiosInstanceWithProxy(options.proxy).get(url);
    const $ = cheerio.load(response.data);
    const videos = this.parseVideos($);

    // XNXX shows 32 videos per page
    const hasMore = $("#content .mozaique .thumb-block").length === 32;

    return {
      items: videos,
      pageInfo: { hasNextPage: hasMore },
    };
  }

  private getPreviousMonth(): string {
    const date = new Date();
    // Set to previous month by subtracting 1 month
    date.setMonth(date.getMonth() - 1);

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const formattedMonth = month.toString().padStart(2, "0");

    return `${year}-${formattedMonth}`;
  }

  private buildUrl(options: VideosRequest): string {
    const page = options?.page || 1; // Default to page 1
    const sortValue = options.sort;
    const value = SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS]?.value;

    // Construct the URL based on the sort option
    let url = "";

    switch (sortValue) {
      case "relevance":
        url =
          (options.query
            ? `${this.baseUrl}/search/${encodeURIComponent(options.query)}`
            : `${this.baseUrl}/best/${this.getPreviousMonth()}`) + (page > 1 ? "/" + page : ""); // No query, just base URL
        break;
      case "best":
        url =
          (options.query
            ? `${this.baseUrl}/search/hits/${encodeURIComponent(options.query)}`
            : `${this.baseUrl}/hits`) + (page > 1 ? "/" + page : ""); // No query, just hits
        break;
      case "recent":
        url =
          (options.query
            ? `${this.baseUrl}/search/month/${encodeURIComponent(options.query)}`
            : `${this.baseUrl}/search/month`) + (page > 1 ? "/" + page : ""); // No query needed for recent
        break;
      case "duration":
        url =
          (options.query
            ? `${this.baseUrl}/search/${value}/${encodeURIComponent(options.query)}`
            : `${this.baseUrl}/search/${value}`) + (page > 1 ? "/" + page : ""); // Include query if present
        break;
      default:
        url =
          (options.query
            ? `${this.baseUrl}/search/${encodeURIComponent(options.query)}`
            : `${this.baseUrl}/best/${this.getPreviousMonth()}`) + (page > 1 ? "/" + page : ""); // Fallback to base URL
    }

    return url;
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
        const thumb = $el.find(".thumb img").attr("data-src") || $el.find(".thumb img").attr("src") || "";
        const videoId = $el.find(".thumb img").attr("data-videoid");

        // Metadata
        const $metadata = $el.find(".thumb-under p.metadata");
        const duration = this.parseDuration($metadata.clone().children().remove().end().text().trim());

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
          }),
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
