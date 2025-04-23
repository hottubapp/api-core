import axios from "axios";
import { VideosRequest, createAxiosInstanceWithProxy } from "@hottubapp/core";
import XvideosProvider from "./XvideosProvider";

const mockedAxios = {
  get: jest.fn(),
};

describe("XvideosProvider", () => {
  let provider: XvideosProvider;

  beforeEach(() => {
    provider = new XvideosProvider();
    jest.clearAllMocks();

    // Add more explicit logging for debugging
    const mockFn = jest.fn().mockResolvedValue(mockedAxios);
    (createAxiosInstanceWithProxy as jest.Mock).mockImplementation((...args) => {
      console.log("Mock called with:", args);
      return mockFn(...args);
    });
  });

  describe("URL building", () => {
    it("builds search URL with query", async () => {
      const options: VideosRequest = {
        query: "test search",
        page: 1,
        // limit: 25,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/?k=test%20search&p=0");
    });

    it("includes page number in search URL", async () => {
      const options: VideosRequest = {
        query: "test",
        page: 3,
        // limit: 25,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/?k=test&p=2");
    });

    it("builds popular URL correctly", async () => {
      const options: VideosRequest = {
        page: 2,
        // limit: 25,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/new/2");
    });

    it("handles different sort options", async () => {
      const options: VideosRequest = {
        query: "test",
        page: 1,
        // limit: 25,
        sort: "rating",
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xvideos.com/?k=test&p=0&sort=rating");
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
        page: 1,
        // limit: 25,
      });

      const video = result.items[0];
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
        page: 1,
        // limit: 25,
      });

      expect(result.items[0].views).toBeUndefined();
      expect(result.items[0].uploader).toBeUndefined();
      expect(result.items[0].uploaderUrl).toBeUndefined();
      expect(result.items[0].verified).toBe(false);
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
        page: 1,
        // limit: 25,
      });

      expect(result.pageInfo?.hasNextPage).toBe(true);

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
        page: 1,
        // limit: 25,
      });

      expect(result.pageInfo?.hasNextPage).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("handles network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      const result = await provider.getVideos({
        page: 1,
      });

      expect(result.items).toEqual([]);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("handles malformed HTML", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "Invalid HTML" });

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.items).toEqual([]);
    });
  });
});
