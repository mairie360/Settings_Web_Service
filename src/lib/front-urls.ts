// Front destinations are supplied at runtime so one image can be promoted unchanged.
export const FRONT_URL_KEYS = [
  "DASHBOARD_FRONT_URL",
  "PROJECT_FRONT_URL",
  "CALENDAR_FRONT_URL",
  "MESSAGE_FRONT_URL",
  "ELEARNING_FRONT_URL",
  "ADMINISTRATION_FRONT_URL",
] as const;

export type FrontUrlKey = (typeof FRONT_URL_KEYS)[number];
export type FrontUrls = Partial<Record<FrontUrlKey, string>>;

let browserFrontUrls: FrontUrls = {};

/** Server only: read public frontend destinations from the runtime environment. */
export function readFrontUrlsFromEnv(): FrontUrls {
  const urls: FrontUrls = {};
  for (const key of FRONT_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value) urls[key] = value;
  }
  return urls;
}

export function setBrowserFrontUrls(urls: FrontUrls) {
  browserFrontUrls = urls;
}

export function frontUrl(key: FrontUrlKey): string | undefined {
  return typeof window === "undefined" ? readFrontUrlsFromEnv()[key] : browserFrontUrls[key];
}
