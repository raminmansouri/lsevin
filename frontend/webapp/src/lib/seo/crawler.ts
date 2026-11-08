/**
 * Search and AI crawlers that render JavaScript (Googlebot renders from US IPs,
 * Bingbot, YandexBot, ...). Client code that changes the page's language or
 * address from the visitor's location must leave them alone: a crawler that is
 * sent from /fa to /en treats the Persian page as a redirect and drops it.
 */
const CRAWLER =
  /bot\b|bot\/|crawler|spider|slurp|mediapartners|adsbot|google-inspectiontool|googleother|storebot|lighthouse|chrome-lighthouse|bingpreview|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|yandex|baiduspider|duckduckbot|applebot|petalbot|gptbot|claudebot|perplexitybot|bytespider/i;

export function isCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  return !!userAgent && CRAWLER.test(userAgent);
}

/** In the browser: is this page being rendered by a crawler? */
export function isCrawler(): boolean {
  return typeof navigator !== "undefined" && isCrawlerUserAgent(navigator.userAgent);
}
