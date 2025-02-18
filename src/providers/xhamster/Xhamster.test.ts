import axios from "axios";

import { SearchOptions } from "@/models/SearchOptions";
import XhamsterProvider from "./XhamsterProvider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("XhamsterProvider", () => {
  let provider: XhamsterProvider;

  beforeEach(() => {
    provider = new XhamsterProvider();
    jest.clearAllMocks();
  });

  describe("URL building", () => {
    it("builds search URL with query", async () => {
      const options: SearchOptions = {
        query: "test search",
        page: 1,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: "" });
      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://xhamster.com/?k=test%2520search&p=0", expect.any(Object));
    });

    it("includes page number in search URL", async () => {
      const options: SearchOptions = {
        query: "test",
        page: 3,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: "" });
      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://xhamster.com/?k=test&p=2", expect.any(Object));
    });

    it("builds popular URL correctly", async () => {
      const options: SearchOptions = {
        page: 2,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: "" });
      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://xhamster.com/new/2", expect.any(Object));
    });

    it("handles different sort options", async () => {
      const options: SearchOptions = {
        query: "test",
        page: 1,
        filters: { sort: "rating" },
      };

      mockedAxios.get.mockResolvedValueOnce({ data: "" });
      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://xhamster.com/?k=test&p=0&rating=", expect.any(Object));
    });
  });

  describe("Response parsing", () => {
    const mockHtmlResponse = `
      <div class="thumb-list">
        <div class="thumb-list__item video-thumb">
          <div class="thumb-image-container">
            <img class="thumb-image-container__image" src="https://thumb.jpg" />
          </div>
          <a class="video-thumb-info__name" href="/video12345/test_video">Test Video Title</a>
          <div class="video-thumb-views">1.2M Views</div>
          <div data-testid="video-duration">5:00</div>
          <a class="video-uploader__name" href="/channels/test-channel">TestUploader</a>
        </div>
      </div>
    `;

    it("correctly parses video response", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockHtmlResponse });

      const result = await provider.getVideos({ page: 1 });

      const video = result.videos[0];
      expect(video).toMatchObject({
        displayId: "test_video",
        title: "Test Video Title",
        url: "https://xhamster.com/video12345/test_video",
        duration: 300, // 5 minutes in seconds
        views: 1200000,
        channel: "xhamster",
        thumb: "https://thumb.jpg",
        uploader: "TestUploader",
        uploaderUrl: "https://xhamster.com/channels/test-channel",
        verified: false,
      });
    });

    it("handles missing optional fields", async () => {
      const htmlWithMissingFields = `
        <div class="thumb-list">
          <div class="thumb-list__item video-thumb">
            <div class="thumb-image-container">
              <img class="thumb-image-container__image" src="https://thumb.jpg" />
            </div>
            <a class="video-thumb-info__name" href="/video12345/test_video">Test Video</a>
            <div data-testid="video-duration">5:00</div>
          </div>
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlWithMissingFields });

      const result = await provider.getVideos({ page: 1 });

      expect(result.videos[0].views).toBeUndefined();
      expect(result.videos[0].uploader).toBeUndefined();
      expect(result.videos[0].uploaderUrl).toBeUndefined();
      expect(result.videos[0].verified).toBe(false);
    });

    it("determines hasNextPage based on video count", async () => {
      // Create mock HTML with 36 videos (full page)
      const fullPageHtml = `
        <div class="thumb-list">
          ${Array.from(
            { length: 36 },
            (_, i) => `
            <div class="thumb-list__item video-thumb">
              <div class="thumb-image-container">
                <img class="thumb-image-container__image" src="https://thumb.jpg" />
              </div>
              <a class="video-thumb-info__name" href="/video${i}/test">Test ${i}</a>
              <div data-testid="video-duration">5:00</div>
            </div>
          `,
          ).join("")}
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: fullPageHtml });

      let result = await provider.getVideos({ page: 1 });
      expect(result.hasNextPage).toBe(true);

      // Test with less than 36 videos (last page)
      const lastPageHtml = `
        <div class="thumb-list">
          ${Array.from(
            { length: 20 },
            (_, i) => `
            <div class="thumb-list__item video-thumb">
              <div class="thumb-image-container">
                <img class="thumb-image-container__image" src="https://thumb.jpg" />
              </div>
              <a class="video-thumb-info__name" href="/video${i}/test">Test ${i}</a>
              <div data-testid="video-duration">5:00</div>
            </div>
          `,
          ).join("")}
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: lastPageHtml });

      result = await provider.getVideos({ page: 1 });
      expect(result.hasNextPage).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("handles network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      await expect(provider.getVideos({ page: 1 })).rejects.toThrow("Network Error");
    });

    it("handles malformed HTML", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "Invalid HTML" });

      const result = await provider.getVideos({ page: 1 });
      expect(result.videos).toEqual([]);
    });
  });
});
