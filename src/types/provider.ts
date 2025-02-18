import { Video } from "../models/Video";
import { SearchOptions } from "../models/SearchOptions";
import { Channel } from "./channel";

/**
 * Represents the result of a video search.
 */
export interface VideoResult {
  /**
   * An array of videos returned from the search.
   * @type {Video[]}
   */
  videos: Video[];

  /**
   * The total number of results available.
   * @type {number}
   */
  totalResults: number;

  /**
   * Indicates if there are more results available for pagination.
   * @type {boolean}
   */
  hasNextPage: boolean;
}

/**
 * Base interface for any type of content provider.
 */
export interface ContentProvider {
  /**
   * The channel associated with the content provider.
   * @type {Channel}
   */
  readonly channel: Channel;

  /**
   * Single method to get videos with flexible options.
   * @param {SearchOptions} options - Options for retrieving videos.
   * @returns {Promise<VideoResult>} A promise that resolves to the video result.
   */
  getVideos(options: SearchOptions): Promise<VideoResult>;

  /**
   * Optional method to get details of a specific video.
   * @param {string} url - The URL of the video.
   * @returns {Promise<Video>} A promise that resolves to the video details.
   */
  getVideoDetails?(url: string): Promise<Video>;

  /**
   * Optional method to get related videos.
   * @param {string} videoId - The ID of the video to find related videos for.
   * @param {PaginationOptions} options - Options for pagination.
   * @returns {Promise<VideoResult>} A promise that resolves to the related video results.
   */
  getRelatedVideos?(videoId: string, options: SearchOptions): Promise<VideoResult>;
}
