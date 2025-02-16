export interface ChannelOptionChoice {
  id: string;
  title: string;
}

export interface ChannelOption {
  id: string;
  title: string;
  systemImage?: string;
  colorName?: string;
  multiSelect?: boolean;
  options: ChannelOptionChoice[];
}

export interface Channel {
  id: string;
  name: string;
  premium?: boolean;
  favicon: string;
  description?: string;
  status: "active" | "inactive" | "degraded" | "maintenance";
  categories: string[];
  options: ChannelOption[];
}
