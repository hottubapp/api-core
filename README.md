# Hot Tub API Core

This is the core API for the Hot Tub app. It contains the types, models, and providers for the API.

## Providers

The API is built around the concept of providers. Each provider is responsible for fetching data from a specific source.

Providers are defined as classes that implement the `ContentProvider` interface.

Providers are registered in the `providers` object.

## Channels

Channels are defined as constants in the `channels` object.

Channels are used to identify the source of the content.

## Registry

The registry is a class that contains the providers and channels.

It is used to get the appropriate provider and channel for a given network.

You may register additional providers and channels in the registry.

```ts
const registry = new VideoProviderRegistry({
  hottub: HotTubProvider, // Hot Tub Pro for example
});
```

## Usage

```ts
const videos = await registry.getVideos("hottub", { query: "test" });
```
