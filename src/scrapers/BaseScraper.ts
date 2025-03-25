import { ContentProvider, VideosResponse, VideosRequest, Channel } from "@hottubapp/core";

export abstract class BaseScraper implements ContentProvider {
  constructor(
    public readonly channel: Channel,
    protected readonly baseUrl: string,
  ) {}

  abstract getVideos(options: VideosRequest): Promise<VideosResponse>;

  // Common scraper utilities can go here
  protected validateOptions(options: VideosRequest): void {
    if (options.page && options.page < 1) throw new Error("Page must be >= 1");
    // if (options.limit < 1) throw new Error("Limit must be >= 1");
  }
}
