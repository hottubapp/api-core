import { Channel, ChannelStatus, ChannelOption } from "@hottubapp/core";

export const SORT_OPTIONS = {
  popular: { id: "popular", title: "Popular", value: "popular" },
  latest: { id: "latest", title: "Latest", value: "latest" },
  longest: { id: "longest", title: "Longest", value: "longest" },
  shortest: { id: "shortest", title: "Shortest", value: "shortest" },
  "top-rated": { id: "top-rated", title: "Top Rated", value: "top-rated" },
  "top-weekly": { id: "top-weekly", title: "Top Weekly", value: "top-weekly" },
  "top-monthly": { id: "top-monthly", title: "Top Monthly", value: "top-monthly" },
} as const;

export const EPORNER_CHANNEL: Channel = {
  id: "eporner",
  name: "Eporner",
  favicon: "https://www.google.com/s2/favicons?sz=64&domain=eporner.com",
  description: "Watch Full HD Porn Videos for free.",
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
  ytdlpCommand: "--format all[ext=mp4][vcodec!*=av1]",
};
