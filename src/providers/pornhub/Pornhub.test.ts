import axios from "axios";

import { SearchOptions } from "@/models/SearchOptions";
import PornhubProvider from "./PornhubProvider";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("PornhubProvider", () => {
  let provider: PornhubProvider;

  beforeEach(() => {
    provider = new PornhubProvider();
    jest.clearAllMocks();

    // Default mock response for URL building tests
    mockedAxios.get.mockResolvedValue({
      data: `
        <div class="showingCounter">Showing 1-25 of 1,234 Videos</div>
        <ul class="videos search-video-thumbs"></ul>
      `,
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
        expect.stringContaining("https://www.pornhub.com/video"),
        expect.any(Object)
      );

      const url = mockedAxios.get.mock.calls[0][0];
      const params = new URLSearchParams(url.split("?")[1]);

      expect(params.get("page")).toBe("1");
    });

    it("includes search query when provided", async () => {
      const options: SearchOptions = {
        query: "test search",
        page: 1,
        // limit: 25,
      };

      await provider.getVideos(options);

      const url = mockedAxios.get.mock.calls[0][0];
      expect(url).toContain("/video/search");

      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("search")).toBe("test search");
    });

    it("handles different sort options", async () => {
      const options: SearchOptions = {
        page: 1,
        // limit: 25,
        sort: "recent",
      };

      await provider.getVideos(options);

      const url = mockedAxios.get.mock.calls[0][0];
      const params = new URLSearchParams(url.split("?")[1]);
      expect(params.get("o")).toBe("cm");
    });
  });

  describe("Response parsing", () => {
    const createMockVideo = (id: string) => `
      <li>
        <a href="/view/${id}">
          <img data-mediumthumb="https://thumb.jpg" data-mediabook="https://preview.mp4" />
          <span class="title">Test Video ${id}</span>
          <span class="duration">10:30</span>
          <span class="views">1.2M</span>
        </a>
        <div class="usernameWrap">
          <a href="/users/testuser">TestUser</a>
          <span class="usernameBadgesWrapper">
            <span class="verified-icon"></span>
          </span>
        </div>
      </li>
    `;

    const mockHtmlResponse = `
      <div class="showingCounter">Showing 1-25 of 1,234 Videos</div>
      <ul class="videos search-video-thumbs">
        ${createMockVideo("123")}
      </ul>
    `;

    it("correctly parses video response", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockHtmlResponse });

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.videos[0]).toEqual({
        id: expect.any(String),
        displayId: "123",
        hashedUrl: expect.any(String),
        title: "Test Video 123",
        url: "https://pornhub.com/view/123",
        duration: 630, // 10:30 in seconds
        views: 1200000,
        channel: "pornhub",
        thumb: "https://thumb.jpg",
        preview: "https://preview.mp4",
        uploader: "TestUser",
        uploaderUrl: "https://pornhub.com/users/testuser",
        verified: true,
      });

      expect(result.totalResults).toBe(1234);
      expect(result.hasNextPage).toBe(true);
    });

    it("handles missing optional fields", async () => {
      const htmlWithMissingFields = `
        <div class="showingCounter">Showing 1-25 of 1,234 Videos</div>
        <ul class="videos search-video-thumbs">
          <li>
            <a href="/view/123">
              <img data-mediumthumb="https://thumb.jpg" />
              <span class="title">Test Video</span>
              <span class="duration">10:30</span>
              <span class="views">1.2M</span>
            </a>
            <div class="usernameWrap">
              <a href="/users/testuser">TestUser</a>
            </div>
          </li>
        </ul>
      `;

      mockedAxios.get.mockResolvedValueOnce({ data: htmlWithMissingFields });

      const result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.videos[0].preview).toBeUndefined();
      expect(result.videos[0].verified).toBe(false);
    });

    it("correctly determines hasNextPage", async () => {
      // Test case 1: Has next page (total > current page * items per page)
      mockedAxios.get.mockResolvedValueOnce({
        data: `
          <div class="showingCounter">Showing 1-25 of 1,234 Videos</div>
          <ul class="videos search-video-thumbs">
            ${Array.from({ length: 25 }, (_, i) => createMockVideo(`${i + 1}`)).join("")}
          </ul>
        `,
      });

      let result = await provider.getVideos({
        page: 1,
        // limit: 25,
      });

      expect(result.hasNextPage).toBe(true);

      // Test case 2: No next page (total <= current page * items per page)
      mockedAxios.get.mockResolvedValueOnce({
        data: `
          <div class="showingCounter">Showing 1-20 of 20 Videos</div>
          <ul class="videos search-video-thumbs">
            ${Array.from({ length: 20 }, (_, i) => createMockVideo(`${i + 1}`)).join("")}
          </ul>
        `,
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
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

      await expect(
        provider.getVideos({
          page: 1,
          // limit: 25,
        })
      ).rejects.toThrow("Network Error");
    });
  });
});
