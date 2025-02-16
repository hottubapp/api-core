import PornhubProvider from "./providers/pornhub/PornhubProvider";
import XnxxProvider from "./providers/xnxx/XnxxProvider";
import XvideosProvider from "./providers/xvideos/XvideosProvider";
import EpornerProvider from "./providers/eporner/EpornerProvider";

async function testProvider(name: string, provider: any) {
  console.log(`\nTesting ${name}...`);

  try {
    // Test search
    console.log("Testing search...");
    const searchResults = await provider.getVideos({
      // query: "test",
      pagination: { page: 1, limit: 25 },
    });
    console.log(`✓ Found ${searchResults.videos.length} videos`);
    console.log("Sample video:", JSON.stringify(searchResults.videos[0], null, 2));

    // Test popular/trending
    console.log(`\nTesting ${name} popular...`);
    const popularResults = await provider.getVideos({
      pagination: { page: 1, limit: 25 },
    });
    console.log(`✓ Found ${popularResults.videos.length} videos`);

    console.log(`\n${name} tests passed! ✅`);
  } catch (error) {
    console.error(`❌ ${name} error:`, error);
  }
}

async function main(providerName?: string) {
  const providers = {
    pornhub: new PornhubProvider(),
    xnxx: new XnxxProvider(),
    xvideos: new XvideosProvider(),
    eporner: new EpornerProvider(),
  };

  // If a specific provider is provided, test that provider
  if (providerName && providers[providerName as keyof typeof providers]) {
    await testProvider(
      providerName as keyof typeof providers,
      providers[providerName as keyof typeof providers]
    );
  } else {
    for (const [name, provider] of Object.entries(providers)) {
      await testProvider(name, provider);
    }
  }
}

const specificProvider = process.argv[2]; // Get provider name from command line argument
main(specificProvider).catch(console.error);
