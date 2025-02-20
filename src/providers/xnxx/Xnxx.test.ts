import axios from "axios";

import { SearchOptions } from "@/models/SearchOptions";
import XnxxProvider from "./XnxxProvider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("XnxxProvider", () => {
  let provider: XnxxProvider;

  beforeEach(() => {
    provider = new XnxxProvider();
    jest.clearAllMocks();
  });

  describe("URL building", () => {
    it("builds search URL with query", async () => {
      const options: SearchOptions = {
        query: "test search",
        page: 1,
        // limit: 25,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xnxx.com/search/test%20search");
    });

    it("includes page number in search URL", async () => {
      const options: SearchOptions = {
        query: "test",
        page: 3,
        // limit: 25,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xnxx.com/search/test/2");
    });

    it("builds popular URL with correct month", async () => {
      const options: SearchOptions = {
        page: 1,
        // limit: 25,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      // Mock current date
      const mockDate = new Date("2024-03-15");
      jest.spyOn(global, "Date").mockImplementation(() => mockDate);

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xnxx.com/best/2024-03");

      // Restore Date
      jest.restoreAllMocks();
    });

    it("handles different sort options", async () => {
      const options: SearchOptions = {
        query: "test",
        page: 1,
        // limit: 25,
        sort: "rating",
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: '<div id="content"><div class="mozaique"></div></div>',
      });

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith("https://www.xnxx.com/search/test?sort=rating");
    });
  });

  describe("Response parsing", () => {
    const mockHtmlResponse = `
      <div id="content">
        <div class="mozaique">
          <div class="thumb-block">
            <div class="thumb">
              <img src="https://thumb.jpg" data-videoid="123456" />
            </div>
            <div class="thumb-under">
              <p><a href="/video-123456/test_video">Test Video</a></p>
              <p class="metadata">
                <span class="right">1.2M</span>
                10
                <span class="superfluous">85%</span>
                <span class="video-hd">720p</span>
              </p>
              <p class="uploader">
                <a href="/user/testuser">
                  <span class="name">TestUser</span>
                </a>
              </p>
            </div>
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

      const video = result.videos[0];
      expect(video).toMatchObject({
        id: expect.any(String),
        displayId: "123456",
        hashedUrl: expect.any(String),
        title: "Test Video",
        url: "https://www.xnxx.com/video-123456/test_video",
        duration: 600,
        views: 1200000,
        rating: 85,
        channel: "xnxx",
        thumb: "https://thumb.jpg",
        uploader: "TestUser",
        uploaderUrl: "https://www.xnxx.com/user/testuser",
      });
    });

    it("handles missing optional fields", async () => {
      const htmlWithMissingFields = `
        <div id="content">
          <div class="mozaique">
            <div class="thumb-block">
              <div class="thumb">
                <img src="https://thumb.jpg" />
              </div>
              <div class="thumb-under">
                <p><a href="/video-123456/test_video">Test Video</a></p>
                <p class="metadata">10</p>
              </div>
            </div>
          </div>
        </div>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlWithMissingFields });

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.videos[0].views).toBeUndefined();
      expect(result.videos[0].rating).toBeUndefined();
      expect(result.videos[0].uploader).toBeUndefined();
      expect(result.videos[0].uploaderUrl).toBeUndefined();
    });
  });

  describe("Error handling", () => {
    it("handles network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      await expect(
        provider.getVideos({
          page: 1,
          // limit: 25,
        })
      ).rejects.toThrow("Network Error");
    });

    it("handles malformed HTML", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "Invalid HTML" });

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.videos).toEqual([]);
    });
  });
});
