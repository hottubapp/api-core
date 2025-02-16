/*
import axios from "axios";

import * as cheerio from "cheerio";
import { Video } from "../../models/Video";

export interface CheerioParser {
  parseVideos($: cheerio.Root): Video[];
  parseTotalResults($: cheerio.Root): number;
  parseHasNextPage($: cheerio.Root): boolean;
}

export class CheerioStrategy {
  constructor(
    private readonly parser: CheerioParser,
    private readonly headers?: Record<string, string>
  ) {}

  async load(url: string): Promise<cheerio.Root> {
    const response = await axios.get(url, { headers: this.headers });
    return cheerio.load(response.data);
  }

  parseVideos($: cheerio.Root): Video[] {
    return this.parser.parseVideos($);
  }

  parseTotalResults($: cheerio.Root): number {
    return this.parser.parseTotalResults($);
  }

  parseHasNextPage($: cheerio.Root): boolean {
    return this.parser.parseHasNextPage($);
  }
}
*/
