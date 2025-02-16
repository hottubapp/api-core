import { Video } from "../models/Video";
import { SearchOptions } from "../models/SearchOptions";
import { VideoResult } from "../types/provider";

export interface Scraper {
  name: string;

  // Core methods
  getVideos(options: SearchOptions): Promise<VideoResult>;

  // Optional methods
  getVideoDetails?(videoId: string): Promise<Video>;
}
