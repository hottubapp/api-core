import axios from "axios";

import { SearchOptions } from "@/models/SearchOptions";
import EpornerProvider from "./EpornerProvider";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("EpornerProvider", () => {
  let provider: EpornerProvider;

  beforeEach(() => {
    provider = new EpornerProvider();
    jest.clearAllMocks();

    // Default mock response for URL building tests
    mockedAxios.get.mockResolvedValue({
      data: {
        videos: [],
        total: 0,
        page: 1,
      },
    });
  });

  describe("URL building", () => {
    it("builds basic search URL with defaults", async () => {
      const options: SearchOptions = {
        page: 1,
        // limit: 25,
      };

      await provider.getVideos(options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("https://www.eporner.com/api/v2/video/search/"),
        expect.any(Object)
      );

      const url = mockedAxios.get.mock.calls[0][0];
      const params = new URLSearchParams(url.split("?")[1]);

      expect(params.get("format")).toBe("json");
      expect(params.get("per_page")).toBe("25");
      expect(params.get("page")).toBe("1");
      expect(params.get("order")).toBe("most-popular"); // default sort
    });

    it("includes search query when provided", async () => {
      const options: SearchOptions = {
        query: "test search",
        page: 1,
        // limit: 25,
      };

      await provider.getVideos(options);

      const url = mockedAxios.get.mock.calls[0][0];
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("query")).toBe("test search");
    });

    it("handles different sort options", async () => {
      const options: SearchOptions = {
        page: 1,
        // limit: 25,
        sort: "latest",
      };

      await provider.getVideos(options);

      const url = mockedAxios.get.mock.calls[0][0];
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("order")).toBe("latest");
    });
  });

  describe("Response parsing", () => {
    const mockApiResponse = {
      data: {
        videos: [
          {
            title: "Test Video",
            url: "https://eporner.com/video/123",
            length_sec: 300,
            views: 1000,
            default_thumb: {
              src: "https://thumb.jpg",
            },
            uploader: "TestUser",
            uploader_url: "https://eporner.com/user/testuser",
            verified: true,
            added: "2023-01-01T00:00:00Z",
            rate: "4.5",
            keywords: "tag1,tag2,tag3",
          },
        ],
        total: 100,
        page: 1,
      },
    };

    it("correctly parses video response", async () => {
      mockedAxios.get.mockResolvedValueOnce(mockApiResponse);

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.videos[0]).toEqual({
        id: expect.any(String),
        displayId: "123",
        hashedUrl: expect.any(String),
        title: "Test Video",
        url: "https://eporner.com/video/123",
        duration: 300,
        views: 1000,
        rating: 90, // 4.5 * 20
        channel: "eporner",
        thumb: "https://thumb.jpg",
        uploadedAt: new Date("2023-01-01T00:00:00Z"),
        tags: ["tag1", "tag2", "tag3"],
        uploader: "TestUser",
        uploaderUrl: "https://eporner.com/user/testuser",
        verified: true,
      });
    });

    it("handles missing optional fields", async () => {
      const responseWithMissingFields = {
        data: {
          videos: [
            {
              title: "Test Video",
              url: "https://eporner.com/video/123",
              length_sec: 300,
              views: 1000,
              default_thumb: {
                src: "https://thumb.jpg",
              },
              uploader: "TestUser",
              uploader_url: "https://eporner.com/user/testuser",
              verified: false,
              added: "2023-01-01T00:00:00Z",
              // missing rate and keywords
            },
          ],
          total: 100,
          page: 1,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(responseWithMissingFields);

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.videos[0].rating).toBeUndefined();
      expect(result.videos[0].tags).toEqual([]);
    });

    it("correctly determines hasNextPage", async () => {
      // Test case 1: Has next page
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          videos: [],
          total: 100,
          page: 1,
        },
      });

      let result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.hasNextPage).toBe(true);

      // Test case 2: No next page
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          videos: [],
          total: 25,
          page: 1,
        },
      });

      result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.hasNextPage).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("handles API errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

      await expect(
        provider.getVideos({
          page: 1,
          // limit: 25,
        })
      ).rejects.toThrow("API Error");
    });
  });
});
