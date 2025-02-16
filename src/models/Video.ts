import { sha256 } from "@/utils/hash";

export interface VideoData {
  displayId: string;
  title: string;
  url: string;
  duration: number;
  views?: number;
  rating?: number;
  channel: string;
  thumb: string;
  preview?: string;
  uploadedAt?: Date;
  tags?: string[];
  categories?: string[];
  verified?: boolean;
  uploader?: string;
  uploaderUrl?: string;
  uploaderId?: string;
  aspectRatio?: number;
  performers?: string[];
}

export class Video {
  readonly id: string;
  readonly hashedUrl: string;
  readonly displayId: string;
  readonly title: string;
  readonly url: string;
  readonly duration: number;
  readonly views?: number;
  readonly rating?: number;
  readonly channel: string;
  readonly thumb: string;
  readonly preview?: string;
  readonly uploadedAt?: Date;
  readonly tags?: string[];
  readonly categories?: string[];
  readonly verified?: boolean;
  readonly uploader?: string;
  readonly uploaderUrl?: string;
  readonly uploaderId?: string;
  readonly aspectRatio?: number;
  readonly performers?: string[];

  constructor(data: VideoData) {
    this.id = sha256(data.url);
    this.hashedUrl = sha256(data.url);
    this.displayId = data.displayId;
    this.title = data.title;
    this.url = data.url;
    this.duration = data.duration;
    this.views = data.views;
    this.rating = data.rating;
    this.channel = data.channel;
    this.thumb = data.thumb;
    this.preview = data.preview;
    this.uploadedAt = data.uploadedAt;
    this.tags = data.tags;
    this.categories = data.categories;
    this.verified = data.verified;
    this.uploader = data.uploader;
    this.uploaderUrl = data.uploaderUrl;
    this.uploaderId = data.uploaderId;
    this.aspectRatio = data.aspectRatio;
    this.performers = data.performers;
  }
}
