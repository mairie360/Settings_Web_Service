import { frontUrl, type FrontUrlKey } from "./front-urls";

function configuredFrontUrl(key: FrontUrlKey): string | undefined {
  const value = frontUrl(key)?.trim();
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

/** The current account route is always available; other modules need safe runtime URLs. */
export function getActiveFrontHrefs() {
  return {
    dashboard: configuredFrontUrl("DASHBOARD_FRONT_URL"),
    projects: configuredFrontUrl("PROJECT_FRONT_URL"),
    messages: configuredFrontUrl("MESSAGE_FRONT_URL"),
    training: configuredFrontUrl("ELEARNING_FRONT_URL"),
    calendar: configuredFrontUrl("CALENDAR_FRONT_URL"),
    admin: configuredFrontUrl("ADMINISTRATION_FRONT_URL"),
    settings: "/",
    profile: "/",
  };
}
