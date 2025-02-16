import axios from "axios";

import { SearchOptions } from "@/models/SearchOptions";
import XvideosProvider from "./XvideosProvider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("XvideosProvider", () => {
  let provider: XvideosProvider;

  beforeEach(() => {
    provider = new XvideosProvider();
    jest.clearAllMocks();
  });

  describe("URL building", () => {
    it("builds search URL with query", async () => {
      const options: SearchOptions = {
        query: "test search",
        pagination: { page: 1, limit: 25 },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/?k=test%20search&p=0");
    });

    it("includes page number in search URL", async () => {
      const options: SearchOptions = {
        query: "test",
        pagination: { page: 3, limit: 25 },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/?k=test&p=2");
    });

    it("builds popular URL correctly", async () => {
      const options: SearchOptions = {
        pagination: { page: 2, limit: 25 },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/new/2");
    });

    it("handles different sort options", async () => {
      const options: SearchOptions = {
        query: "test",
        pagination: { page: 1, limit: 25 },
        filters: { sort: "rating" },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://www.xvideos.com/?k=test&p=0&sort=rating"
      );
    });
  });

  describe("Response parsing", () => {
    const mockHtmlResponse = `
      <div id="content">
        <div class="mozaique">
          <div class="thumb-block">
            <div class="thumb">
              <img data-src="https://cdn.xvideos.com/thumbs169/test.jpg" />
            </div>
            <div class="title">
              <a href="/video12345/test_video">Test Video Title</a>
            </div>
            <div class="metadata">
              <span class="bg">
                1.2M Views
                <span>
                  <a href="/channels/test-channel" title="Verified Uploader">
                    <span class="name">TestUploader</span>
                  </a>
                </span>
              </span>
            </div>
            <span class="duration">5 min</span>
          </div>
        </div>
      </div>
    `;

    it("correctly parses video response", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockHtmlResponse });

      const result = await provider.getVideos({
        pagination: { page: 1, limit: 25 },
      });

      const video = result.videos[0];
      expect(video).toMatchObject({
        id: expect.any(String),
        displayId: "test_video",
        hashedUrl: expect.any(String),
        title: "Test Video Title",
        url: "https://www.xvideos.com/video12345/test_video",
        duration: 300, // 5 minutes in seconds
        views: 1200000,
        channel: "xvideos",
        thumb: "https://cdn.xvideos.com/thumbs169lll/test.jpg",
        uploader: "TestUploader",
        uploaderUrl: "https://www.xvideos.com/channels/test-channel",
        verified: true,
      });
    });

    it("handles missing optional fields", async () => {
      const htmlWithMissingFields = `
        <div id="content">
          <div class="mozaique">
            <div class="thumb-block">
              <div class="thumb">
                <img data-src="https://thumb.jpg" />
              </div>
              <div class="title">
                <a href="/video12345/test_video">Test Video</a>
              </div>
              <div class="metadata">
                <span class="bg"></span>
              </div>
              <span class="duration">5 min</span>
            </div>
          </div>
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlWithMissingFields });

      const result = await provider.getVideos({
        pagination: { page: 1, limit: 25 },
      });

      expect(result.videos[0].views).toBeUndefined();
      expect(result.videos[0].uploader).toBeUndefined();
      expect(result.videos[0].uploaderUrl).toBeUndefined();
      expect(result.videos[0].verified).toBe(false);
    });

    it("determines hasNextPage based on video count", async () => {
      // Create mock HTML with 32 videos (full page)
      const fullPageHtml = `
        <div id="content">
          <div class="mozaique">
            ${Array.from(
              { length: 32 },
              (_, i) => `
              <div class="thumb-block">
                <div class="thumb">
                  <img data-src="https://thumb.jpg" />
                </div>
                <div class="title">
                  <a href="/video${i}/test">Test ${i}</a>
                </div>
                <div class="metadata">
                  <span class="bg"></span>
                </div>
                <span class="duration">5 min</span>
              </div>
            `
            ).join("")}
          </div>
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: fullPageHtml });

      let result = await provider.getVideos({
        pagination: { page: 1, limit: 25 },
      });

      expect(result.hasNextPage).toBe(true);

      // Test with less than 32 videos (last page)
      const lastPageHtml = `
        <div id="content">
          <div class="mozaique">
            ${Array.from(
              { length: 20 },
              (_, i) => `
              <div class="thumb-block">
                <div class="thumb">
                  <img data-src="https://thumb.jpg" />
                </div>
                <div class="title">
                  <a href="/video${i}/test">Test ${i}</a>
                </div>
                <div class="metadata">
                  <span class="bg"></span>
                </div>
                <span class="duration">5 min</span>
              </div>
            `
            ).join("")}
          </div>
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: lastPageHtml });

      result = await provider.getVideos({
        pagination: { page: 1, limit: 25 },
      });

      expect(result.hasNextPage).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("handles network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      await expect(
        provider.getVideos({
          pagination: { page: 1, limit: 25 },
        })
      ).rejects.toThrow("Network Error");
    });

    it("handles malformed HTML", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "Invalid HTML" });

      const result = await provider.getVideos({
        pagination: { page: 1, limit: 25 },
      });

      expect(result.videos).toEqual([]);
    });
  });
});
