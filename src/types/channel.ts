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

export enum ChannelStatus {
  Active = "active", // Channel is working normally
  Inactive = "inactive", // Channel deliberately disabled/suspended
  Degraded = "degraded", // Channel working with reduced functionality
  Maintenance = "maintenance", // Channel temporarily down for planned work
  Offline = "offline", // Channel unavailable due to technical issues
  Deprecated = "deprecated", // Channel scheduled for removal
  Testing = "testing", // Channel is in testing mode for development
}

export interface Channel {
  id: string;
  name: string;
  premium?: boolean;
  favicon: string;
  description?: string;
  status: ChannelStatus;
  categories: string[];
  options: ChannelOption[];
  nsfw?: boolean;
}
