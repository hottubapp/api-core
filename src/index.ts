import { SearchOptions } from "./models/SearchOptions";
import { ContentProvider } from "./types/provider";
import * as providers from "./providers";
export * from "./types";
export * from "./utils";

// get all the default channels from the providers
const channels = Object.values(providers).map((provider) => new provider().channel);

/**
 * A registry of video providers.
 */
export class VideoProviderRegistry {
  /**
   * A registry of content providers.
   * @type {Record<string, new () => ContentProvider>}
   */
  readonly providers: Record<string, new () => ContentProvider>;

  /**
   * Creates an instance of VideoProviderRegistry.
   * @param {Record<string, new () => ContentProvider>} [additionalProviders={}] - An optional object to register additional content providers.
   */
  constructor(private readonly additionalProviders: Record<string, new () => ContentProvider> = {}) {
    this.providers = { ...providers, ...additionalProviders };
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
   * @param {SearchOptions} options - Options for searching videos.
   * @returns {Promise<Video[]>} A promise that resolves to an array of videos.
   * @throws {Error} If the provider for the specified channel is not found.
   */
  async getVideos(channel: string, options: SearchOptions) {
    const ProviderClass = this.providers[channel];
    if (!ProviderClass) {
      throw new Error(`Provider for channel "${channel}" not found.`);
    }

    const instance = new ProviderClass();
    return instance.getVideos(options);
  }
}

export { providers, channels };
