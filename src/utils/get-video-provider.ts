import * as providers from "@/providers";
import { ContentProvider } from "@hottubapp/core";

export function getProvider(network: string): ContentProvider {
  const Provider = providers[network.toLowerCase() as keyof typeof providers];
  if (!Provider) {
    throw new Error(`No provider found for network: ${network}`);
  }

  return new Provider();
}

// Export available providers for convenience
export const availableProviders = Object.keys(providers);
