/*
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import { Video } from "../../models/Video";

puppeteer.use(StealthPlugin());

export interface PuppeteerParser {
  parseVideos(page: puppeteer.Page): Promise<Video[]>;
  parseTotalResults(page: puppeteer.Page): Promise<number>;
  parseHasNextPage(page: puppeteer.Page): Promise<boolean>;
}

export class PuppeteerStrategy {
  private browser: puppeteer.Browser | null = null;

  constructor(
    private readonly parser: PuppeteerParser,
    private readonly options?: puppeteer.LaunchOptions
  ) {}

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch(this.options);
    }
  }

  async load(url: string): Promise<puppeteer.Page> {
    await this.init();
    const page = await this.browser!.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    return page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async parseVideos(page: puppeteer.Page): Promise<Video[]> {
    return this.parser.parseVideos(page);
  }

  async parseTotalResults(page: puppeteer.Page): Promise<number> {
    return this.parser.parseTotalResults(page);
  }

  async parseHasNextPage(page: puppeteer.Page): Promise<boolean> {
    return this.parser.parseHasNextPage(page);
  }
}
*/
