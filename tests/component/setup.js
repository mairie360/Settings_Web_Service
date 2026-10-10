import { vi, beforeEach } from 'vitest';
import { loadSessionRole } from '@/lib/session-role';
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

vi.mock('@/lib/session-role', () => ({ loadSessionRole: vi.fn() }));
beforeEach(() => vi.mocked(loadSessionRole).mockReset().mockResolvedValue(false));
