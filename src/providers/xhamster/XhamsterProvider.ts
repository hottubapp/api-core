import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { parseProxy } from "@hottubapp/core";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { ContentProvider, VideosResponse, VideosRequest, Video } from "@hottubapp/core";
import { XHAMSTER_CHANNEL, SORT_OPTIONS } from "./XhamsterChannel";

// Use the stealth plugin
puppeteer.use(StealthPlugin());

export default class XhamsterProvider implements ContentProvider {
  readonly channel = XHAMSTER_CHANNEL;
  private readonly baseUrl = "https://xhamster.com";

  public async getVideos(options: VideosRequest): Promise<VideosResponse> {
    const url = this.buildUrl(options);

    try {
      const content = await this.fetchData(url, options.proxy);
      const $ = cheerio.load(content);
      const videos = this.parseVideos($);

      // XHamster typically shows 36 videos per page
      const hasMore = $(".thumb-list__item.video-thumb").length === 36;

      return {
        items: videos,
        pageInfo: { hasNextPage: hasMore },
      };
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos from Xhamster");
    }
  }

  private buildUrl(options: VideosRequest): string {
    if (!options.query) {
      return this.buildPopularUrl(options);
    }

    const page = options?.page || 1;
    const params = new URLSearchParams();
    params.set("page", String(Math.max(1, page)));

    // Handle sort option
    const sortValue = options.sort;
    if (typeof sortValue === "string" && sortValue in SORT_OPTIONS) {
      let sortOption = SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS];
      if (sortOption.value) {
        params.set("sort", sortOption.value);
      }
    }

    return `${this.baseUrl}/search/${options.query}?${params.toString()}`;
  }

  private buildPopularUrl(options: VideosRequest): string {
    let page = "";
    if (options?.page && options?.page > 1) {
      page = `/${Math.max(1, options.page)}`;
    }
    const sortValue = options?.sort;
    let url = `${this.baseUrl}`;

    if (typeof sortValue === "string" && sortValue in SORT_OPTIONS) {
      let path = SORT_OPTIONS[sortValue as keyof typeof SORT_OPTIONS].id;
      switch (path) {
        case "relevance":
          break;
        case "new":
          url += "/newest";
          break;
        case "views":
          url += "/most-viewed/weekly";
          break;
        case "rating":
          url += "/best/weekly";
          break;
        case "duration":
          url += "/best/monthly?min-duration=30";
          break;
      }
    }

    return `${url}${page}`;
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
        const viewsText = $el.find(".video-thumb-views").text().trim();
        const views = this.parseViews(viewsText);

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
    const match = text.match(/(\d+(\.\d+)?)([kM]?)\s*views/i);
    if (!match) return undefined;

    const [, number, , suffix] = match;
    const value = parseFloat(number);

    if (suffix === "k") return Math.round(value * 1000);
    if (suffix === "M") return Math.round(value * 1000000);
    return Math.round(value);
  }

  private async fetchData(url: string, proxy?: string): Promise<string> {
    console.log("🔎 [fetchData] fetching data from Xhamster", url);
    const { host, port, username, password } = parseProxy(proxy);

    const browser = await puppeteer.launch({
      headless: true,
      acceptInsecureCerts: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        ...(host && port ? [`--proxy-server=http://${host}:${port}`] : []),
      ],
    });

    // Get the default browser context and set the cookie
    const context = browser.defaultBrowserContext();
    await context.setCookie({
      name: "parental-control",
      value: "yes",
      domain: ".xhamster.com",
    });

    const page = await browser.newPage();

    // Add proxy authentication headers if credentials exist
    if (username && password) await page.authenticate({ username, password });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "image" || request.resourceType() === "stylesheet") {
        request.abort();
      } else {
        request.continue();
      }
    });

    let redirectedUrl: string | null = null;

    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.redirectChain().length > 0) {
        const originalUrl = new URL(request.redirectChain()[0].url());
        const pageParam = originalUrl.searchParams.get("page");
        const redirectUrl = new URL(request.url());

        if (pageParam) {
          redirectUrl.searchParams.set("page", pageParam);
          redirectedUrl = redirectUrl.toString();
        }

        /*
        console.log("Redirect detected:", {
          from: request.redirectChain()[0].url(),
          to: redirectedUrl || request.url(),
        });
        */
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // If we were redirected and had a page parameter, go to the correct page
    if (redirectedUrl) {
      await page.goto(redirectedUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    }

    const content = await page.content();
    await browser.close();

    return content;
  }
}
