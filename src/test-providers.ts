import { VideoProviderRegistry } from "./index";

const registry = new VideoProviderRegistry();
const providers = registry.providers;

async function testProvider(name: string, providerClass: any) {
  console.log(`\nTesting ${name}...`);

  const provider = new providerClass();

  if (!provider) {
    console.error(`❌ Provider ${name} not found`);
    return;
  }

  try {
    // Test search
    console.log("Testing search...");
    const searchResults = await provider.getVideos({ query: "test", page: 1 });
    console.log(`✓ Found ${searchResults.videos.length} videos`);
    console.log("Search Results:", JSON.stringify(searchResults.videos[0], null, 2));

    // Test popular/trending
    console.log(`\nTesting ${name} popular...`);
    const popularResults = await provider.getVideos({ page: 1 });
    console.log(`✓ Found ${popularResults.videos.length} videos`);
    console.log("Popular Results:", JSON.stringify(popularResults.videos[0], null, 2));

    console.log(`\n${name} tests passed! ✅`);
  } catch (error) {
    console.error(`❌ ${name} error:`, error);
  }
}

async function main(providerName?: string) {
  // If a specific provider is provided, test that provider
  if (providerName && providers[providerName as keyof typeof providers]) {
    await testProvider(providerName as keyof typeof providers, providers[providerName as keyof typeof providers]);
  } else {
    for (const [name, provider] of Object.entries(providers)) {
      await testProvider(name, provider);
    }
  }
}

const specificProvider = process.argv[2]; // Get provider name from command line argument
main(specificProvider).catch(console.error);
