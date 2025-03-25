import { VideoProviderRegistry, providers as allProviders } from "./index";

const registry = new VideoProviderRegistry({ ...allProviders });
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
    const searchResults = await registry.getVideos(name, { query: "test", page: 1 });
    console.log(`✓ Found ${searchResults.items.length} videos`);
    console.log("Search Results:", JSON.stringify(searchResults.items[0], null, 2));

    // Test popular/trending
    console.log(`\nTesting ${name} popular...`);
    const popularResults = await registry.getVideos(name, { page: 1 });
    console.log(`✓ Found ${popularResults.items.length} videos`);
    console.log("Popular Results:", JSON.stringify(popularResults.items[0], null, 2));

    console.log(`\n${name} tests passed! ✅`);
  } catch (error) {
    console.error(`❌ ${name} error:`, error);
  }
}

async function main(providerName?: string) {
  var provider: any = null;
  if (providerName) {
    provider = providers[providerName as keyof typeof providers];
  }

  if (!provider && providerName) {
    console.error(`❌ Provider ${providerName} not found`);
    return;
  }

  // If a specific provider is provided, test that provider
  if (providerName && provider) {
    await testProvider(providerName as keyof typeof providers, provider);
  } else {
    for (const [name, provider] of Object.entries(providers)) {
      await testProvider(name, provider);
    }
  }
}

const specificProvider = process.argv[2]; // Get provider name from command line argument
main(specificProvider).catch(console.error);
