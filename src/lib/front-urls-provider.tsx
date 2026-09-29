"use client";

import type { ReactNode } from "react";
import { setBrowserFrontUrls, type FrontUrls } from "./front-urls";

/** Make server-read runtime destinations available before child navigation renders. */
export function FrontUrlsProvider({ urls, children }: { urls: FrontUrls; children: ReactNode }) {
  if (typeof window !== "undefined") setBrowserFrontUrls(urls);
  return children;
}
