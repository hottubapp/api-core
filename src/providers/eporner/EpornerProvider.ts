import axios from "axios";

import type { ContentProvider, VideoResult } from "@/types";
import { Video } from "@/models/Video";
import { SearchOptions } from "@/models/SearchOptions";
import { EPORNER_CHANNEL, SORT_OPTIONS } from "./EpornerChannel";

type SortKey = keyof typeof SORT_OPTIONS;

interface EpornerVideo {
  title: string;
  url: string;
  length_sec: number;
  views: number;
  default_thumb: {
    src: string;
  };
  uploader: string;
  uploader_url: string;
  verified: boolean;
  added: string;
  rate: string;
  keywords?: string;
}

interface EpornerApiResponse {
  videos: EpornerVideo[];
  total: number;
  page: number;
}

export default class EpornerProvider implements ContentProvider {
  readonly channel = EPORNER_CHANNEL;
  private readonly baseUrl = "https://www.eporner.com/api/v2/video/search/";
  private readonly detailsUrl = "https://www.eporner.com/api/v2/video/id/";

  private validateFilters(filters?: SearchOptions["filters"]): void {
    if (!filters) return;

    // Validate each filter against channel options
    Object.entries(filters).forEach(([key, value]) => {
      const channelOption = this.channel.options.find((opt) => opt.id === key);
      if (!channelOption) {
        throw new Error(`Invalid filter: ${key}`);
      }

      // For array values, check if the option supports multiSelect
      if (Array.isArray(value) && !channelOption.multiSelect) {
        throw new Error(`Filter ${key} does not support multiple values`);
      }

      // Validate value(s) against allowed options
      const allowedValues = channelOption.options.map((opt) => opt.id);
      const values = Array.isArray(value) ? value : [value];
      values.forEach((v) => {
        if (!allowedValues.includes(v)) {
          throw new Error(`Invalid value for ${key}: ${v}`);
        }
      });
    });
  }

  async getVideos(options: SearchOptions): Promise<VideoResult> {
    this.validateFilters(options.filters);
    const url = this.buildUrl(options);

    const response = await axios.get<EpornerApiResponse>(url, {
      headers: {
        Cookie: "parental-control=yes;",
      },
    });

    return {
      videos: this.parseVideos(response.data.videos),
      totalResults: response.data.total,
      hasNextPage: response.data.page * 25 < response.data.total,
    };
  }

  private buildUrl(options: SearchOptions): string {
    const params = new URLSearchParams({
      format: "json",
      per_page: "25",
      gay: "0",
      lq: "0",
    });

    // Add query if present
    if (options.query) {
      params.set("query", options.query);
    }

    // Add page number
    params.set("page", String(options.pagination?.page || 1));

    // Handle sort option
    const sortValue = options.filters?.sort;
    if (typeof sortValue === "string" && this.isSortKey(sortValue)) {
      params.set("order", SORT_OPTIONS[sortValue].value);
    } else {
      params.set("order", "most-popular"); // default sort
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  private isSortKey(value: string): value is SortKey {
    return value in SORT_OPTIONS;
  }

  private parseVideos(videos: EpornerVideo[]): Video[] {
    return videos.map(
      (video) =>
        new Video({
          displayId: video.url.split("/").pop() || "",
          title: video.title,
          url: video.url,
          duration: video.length_sec,
          views: video.views,
          rating: video.rate ? parseFloat(video.rate) * 20 : undefined,
          channel: "eporner",
          thumb: video.default_thumb.src,
          uploadedAt: new Date(video.added),
          tags: video.keywords?.split(",").map((tag) => tag.trim()) || [],
          verified: video.verified,
          uploader: video.uploader,
          uploaderUrl: video.uploader_url,
          // Optional fields
          preview: undefined,
          categories: undefined,
          uploaderId: undefined,
          aspectRatio: undefined,
          performers: undefined,
        })
    );
  }

  async getVideoDetails(url: string): Promise<Video> {
    // Extract video ID from URL (e.g., "https://www.eporner.com/video-IsabYDAiqXa/title/")
    const videoId = url
      .split("/")
      .find((segment) => segment.startsWith("video-"))
      ?.replace("video-", "");

    if (!videoId) {
      throw new Error("Invalid video URL");
    }

    const apiUrl = `${this.detailsUrl}?${new URLSearchParams({
      id: videoId,
      format: "json",
    })}`;

    const response = await axios.get<{ video: EpornerVideo }>(apiUrl, {
      headers: {
        Cookie: "parental-control=yes;",
      },
    });

    return this.parseVideos([response.data.video])[0];
  }
}
