import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { ContentProvider, VideosResponse, VideosRequest, Video, createAxiosInstanceWithProxy } from "@hottubapp/core";
import { PORNHUB_CHANNEL, SORT_OPTIONS } from "./PornhubChannel";
export default class PornhubProvider implements ContentProvider {
  readonly channel = PORNHUB_CHANNEL;
  private readonly baseUrl = "https://www.pornhub.com";

  public async getVideos(options: VideosRequest): Promise<VideosResponse> {
    const url = this.buildUrl(options);

    console.log("🔎 PornhubProvider getVideos", url);

    const axiosInstance = await createAxiosInstanceWithProxy(options.proxy);
    const response = await axiosInstance.get(url, {
      headers: {
        Cookie: "accessAgeDisclaimerPH=1;",
      },
    });

    const $ = cheerio.load(response.data);
    const videos = this.parseVideos($);
    const totalResults = this.parseTotalResults($);
    const currentPage = options?.page || 1;
    const itemsPerPage = 25;

    return {
      items: videos,
      pageInfo: { hasNextPage: currentPage * itemsPerPage < totalResults },
    };
  }

  private buildUrl(options: VideosRequest): string {
    const isSearch = !!options?.query?.length;
    const searchPath = options.query ? "video/search" : "video";
    const params = new URLSearchParams();

    // Add search query if present
    if (options.query) {
      params.set("search", options.query);
    }

    // Add page number
    params.set("page", String(options.page || 1));

    // Handle sort option
    const sortValue = options.sort;

    if (typeof sortValue === "string" && sortValue in SORT_OPTIONS) {
      let [key, value] = SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS].value.split("=");

      if (value) {
        // replace recent wit `cm` when browsing popular
        if (!isSearch && sortValue == "recent") {
          value = value.replace("mr", "cm");
        }

        params.set(key, value);
      }
    }

    return `${this.baseUrl}/${searchPath}${params.toString() ? "?" + params.toString() : ""}`;
  }

  private parseVideos($: CheerioAPI): Video[] {
    const results: Video[] = [];

    $("ul.videos.search-video-thumbs li").each((_, element) => {
      const $el = $(element);

      const thumb = $el.find("img").attr("data-mediumthumb") || "";
      const preview = $el.find("img").attr("data-mediabook");
      const uploaderDiv = $el.find(".usernameWrap");
      const uploader = uploaderDiv.find("a").text().trim();
      const uploaderUrl = uploaderDiv.find("a").attr("href");
      const url = $el.find("a").eq(0).attr("href") || "";
      const verified = $el.find(".usernameBadgesWrapper .verified-icon").length > 0;

      results.push(
        new Video({
          displayId: url.match(/viewkey=([^&]+)/)?.[1] || "",
          title: $el.find(".title").text().trim(),
          url: `https://pornhub.com${url}`,
          duration: this.parseDuration($el.find(".duration").text()),
          views: this.parseViews($el.find(".views").text()),
          channel: "pornhub",
          thumb,
          preview,
          uploader,
          uploaderUrl: uploaderUrl ? `https://pornhub.com${uploaderUrl}` : undefined,
          verified,
        }),
      );
    });

    return results;
  }

  private parseTotalResults($: CheerioAPI): number {
    const text = $(".showingCounter").text();
    const match = text.match(/of\s+([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, "")) : 0;
  }

  private parseDuration(duration: string): number {
    const parts = duration.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  private parseViews(views: string): number {
    const number = views.replace(/[^0-9.KMB]/g, "");
    const multiplier = number.includes("K")
      ? 1000
      : number.includes("M")
        ? 1000000
        : number.includes("B")
          ? 1000000000
          : 1;
    return parseFloat(number) * multiplier;
  }
}
