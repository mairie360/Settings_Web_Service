import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi, beforeEach } from 'vitest';
import { loadSessionRole } from '@/lib/session-role';
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

vi.mock('@/lib/session-role', () => ({ loadSessionRole: vi.fn() }));
beforeEach(() => {
  vi.mocked(loadSessionRole).mockReset().mockResolvedValue(false);
  window.history.replaceState({}, '', '/');
  document.cookie = 'mairie360_sidebar=; Path=/; Max-Age=0';
});

// Component visibility includes consumer styling; geometry is checked in the browser.
const consumerStyles = document.createElement("style");
consumerStyles.textContent = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8") + "\n" + readFileSync(resolve(process.cwd(), "src/app/municipal-theme.css"), "utf8");
document.head.append(consumerStyles);
document.body.classList.add("mairie-ui");
