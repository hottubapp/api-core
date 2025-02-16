import { Video } from "../models/Video";
import { SearchOptions } from "../models/SearchOptions";
import { Channel } from "./channel";

export interface VideoResult {
  videos: Video[];
  totalResults: number;
  hasNextPage: boolean;
}

// Base interface for any type of content provider
export interface ContentProvider {
  readonly channel: Channel;

  // Single method to get videos with flexible options
  getVideos(options: SearchOptions): Promise<VideoResult>;

  // Optional methods
  getVideoDetails?(url: string): Promise<Video>;
  // getRelatedVideos?(videoId: string, options: PaginationOptions): Promise<VideoResult>;
}
