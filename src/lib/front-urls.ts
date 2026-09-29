// Front destinations are supplied at runtime so one image can be promoted unchanged.
export const FRONT_URL_KEYS = [
  "LOGIN_FRONT_URL",
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
  return {
    LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL?.trim() || undefined,
    DASHBOARD_FRONT_URL: process.env.DASHBOARD_FRONT_URL?.trim() || undefined,
    PROJECT_FRONT_URL: process.env.PROJECT_FRONT_URL?.trim() || undefined,
    CALENDAR_FRONT_URL: process.env.CALENDAR_FRONT_URL?.trim() || undefined,
    MESSAGE_FRONT_URL: process.env.MESSAGE_FRONT_URL?.trim() || undefined,
    ELEARNING_FRONT_URL: process.env.ELEARNING_FRONT_URL?.trim() || undefined,
    ADMINISTRATION_FRONT_URL: process.env.ADMINISTRATION_FRONT_URL?.trim() || undefined,
  };
}

export function setBrowserFrontUrls(urls: FrontUrls) {
  browserFrontUrls = urls;
}

export function frontUrl(key: FrontUrlKey): string | undefined {
  return typeof window === "undefined" ? readFrontUrlsFromEnv()[key] : browserFrontUrls[key];
}
