import { Video, VideosRequest, VideosResponse } from "@hottubapp/core";

export interface Scraper {
  name: string;

  // Core methods
  getVideos(options: VideosRequest): Promise<VideosResponse>;

  // Optional methods
  getVideoDetails?(videoId: string): Promise<Video>;
}
