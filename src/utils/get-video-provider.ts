import * as providers from "@/providers";
import { ContentProvider } from "@/types";

console.log(providers);

export function getProvider(network: string): ContentProvider {
  const providerModule = providers[network.toLowerCase() as keyof typeof providers];
  if (!providerModule) {
    throw new Error(`No provider found for network: ${network}`);
  }

  // Each provider module has a default export which is the provider class
  const Provider = providerModule.default;
  if (!Provider) {
    throw new Error(`Provider ${network} has no default export`);
  }

  return new Provider();
}

// Export available providers for convenience
export const availableProviders = Object.keys(providers);
