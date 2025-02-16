import { Channel } from "@/types";

export const SORT_OPTIONS = {
  relevance: { id: "relevance", title: "Most Relevant", value: "" },
  new: { id: "new", title: "Newest", value: "sort=uploaddate" },
  rating: { id: "rating", title: "Top Rated", value: "sort=rating" },
  duration: { id: "duration", title: "Longest", value: "sort=length" },
  views: { id: "views", title: "Most Viewed", value: "sort=views" },
  random: { id: "random", title: "Random", value: "sort=random" },
} as const;

export const XVIDEOS_CHANNEL: Channel = {
  id: "xvideos",
  name: "XVideos",
  description: "The best free porn videos on internet.",
  favicon: "https://www.google.com/s2/favicons?sz=64&domain=xvideos.com",
  status: "active",
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
};
