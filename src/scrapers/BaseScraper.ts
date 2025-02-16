import { ContentProvider, VideoResult } from "../types/provider";
import { SearchOptions } from "../models/SearchOptions";
import { Channel } from "../types/channel";

export abstract class BaseScraper implements ContentProvider {
  constructor(public readonly channel: Channel, protected readonly baseUrl: string) {}

  abstract getVideos(options: SearchOptions): Promise<VideoResult>;

  // Common scraper utilities can go here
  protected validateOptions(options: SearchOptions): void {
    if (options.pagination.page < 1) throw new Error("Page must be >= 1");
    if (options.pagination.limit < 1) throw new Error("Limit must be >= 1");
  }
}
