"use client";

import type { ReactNode } from "react";
import { setBrowserFrontUrls, type FrontUrls } from "./front-urls";
import { configureSidebarCookieDomain } from "@mairie360/lib-components/shell";

/** Make server-read runtime destinations available before child navigation renders. */
export function FrontUrlsProvider({ urls, cookieDomain, children }: { urls: FrontUrls; cookieDomain?: string; children: ReactNode }) {
  if (typeof window !== "undefined") { setBrowserFrontUrls(urls); configureSidebarCookieDomain(cookieDomain); }
  return children;
}
