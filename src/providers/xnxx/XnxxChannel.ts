import { Channel, ChannelStatus } from "@/types";

export const SORT_OPTIONS = {
  relevance: { id: "relevance", title: "Most Relevant", value: "" },
  recent: { id: "recent", title: "Newest", value: "sort=uploaddate" },
  rating: { id: "rating", title: "Top Rated", value: "sort=rating" },
  views: { id: "views", title: "Most Viewed", value: "sort=views" },
  duration: { id: "duration", title: "Longest", value: "sort=length" },
} as const;

export const XNXX_CHANNEL: Channel = {
  id: "xnxx",
  name: "XNXX",
  description: "XNXX delivers free sex movies and fast free porn videos (tube porn).",
  favicon: "https://www.google.com/s2/favicons?sz=64&domain=xnxx.com",
  status: ChannelStatus.Active,
  options: [
    {
      id: "sort",
      title: "Sort",
      systemImage: "list.number",
      colorName: "indigo",
      options: Object.values(SORT_OPTIONS).map(({ id, title }) => ({ id, title })),
    },
  ],
  categories: [],
  nsfw: true,
};
