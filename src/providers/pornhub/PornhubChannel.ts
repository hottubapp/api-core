import { Channel, ChannelStatus, ChannelOption } from "@hottubapp/core";

export const SORT_OPTIONS = {
  relevance: { id: "relevance", title: "Most Relevant", value: "" },
  recent: { id: "recent", title: "Newest", value: "o=mr" },
  rating: { id: "rating", title: "Top Rated", value: "o=tr" },
  views: { id: "views", title: "Most Viewed", value: "o=mv" },
  longest: { id: "longest", title: "Longest", value: "o=lg" },
} as const;

export const PORNHUB_CHANNEL: Channel = {
  id: "pornhub",
  name: "PornHub",
  description: "Home of the best hardcore free porn videos with the hottest adult stars.",
  favicon: "https://www.google.com/s2/favicons?sz=64&domain=pornhub.com",
  status: ChannelStatus.Active,
  options: [
    {
      id: "sort",
      title: "Sort",
      systemImage: "list.number",
      colorName: "indigo",
      options: Object.values(SORT_OPTIONS) as ChannelOption[],
    },
  ],
  categories: [],
  nsfw: true,
};
