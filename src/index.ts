export * from "@hottubapp/core";
import { VideosRequest, VideosResponse, ContentProvider } from "@hottubapp/core";
import * as providers from "./providers";

// get all the default channels from the providers
const channels = Object.values(providers).map((provider) => new provider().channel);

/**
 * A registry of video providers.
 */
class VideoProviderRegistry {
  /**
   * A registry of content providers.
   * @type {Record<string, new () => ContentProvider>}
   */
  readonly providers: Record<string, new () => ContentProvider>;

  /**
   * Creates an instance of VideoProviderRegistry.
   * @param {Record<string, new () => ContentProvider>} [additionalProviders={}] - An optional object to register additional content providers.
   */
  constructor(
    private readonly additionalProviders: Record<string, new () => ContentProvider> = {},
    private readonly options: {
      proxy?: string;
    } = {},
  ) {
    this.providers = { ...additionalProviders };
    this.options = options;
  }

  /**
   * Gets the available channels from all registered providers.
   * @returns {string[]} An array of channel names.
   */
  get channels() {
    return Object.values(this.providers).map((provider) => new provider().channel);
  }

  /**
   * Retrieves videos from the specified channel.
   * @param {string} channel - The name of the channel to fetch videos from.
   * @param {VideosRequest} options - Options for searching videos.
   * @returns {Promise<VideosResponse>} A promise that resolves to an array of videos.
   * @throws {Error} If the provider for the specified channel is not found.
   */
  async getVideos(channel: string, options: VideosRequest) {
    const ProviderClass = this.providers[channel];
    if (!ProviderClass) {
      console.error(`Provider for channel "${channel}" not found.`);
      // throw new Error(`Provider for channel "${channel}" not found.`);
      return {
        pageInfo: {
          hasNextPage: false,
          parameters: {},
          error: `Provider for channel "${channel}" not found.`,
        },
        items: [],
      };
    }

    const instance = new ProviderClass();
    return instance.getVideos({ ...options, proxy: this.options.proxy });
  }
}

export { providers, channels, VideoProviderRegistry };
