import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { loadSettings } from "@/lib/settings-api";
import { downloadLocalFile } from "@/lib/local-assistance";

vi.mock("@/lib/settings-api", () => ({ loadSettings: vi.fn(), saveProfile: vi.fn() }));
vi.mock("@/lib/local-assistance", async (original) => ({ ...await original(), downloadLocalFile: vi.fn() }));

// jsdom has no native dialog methods. These test doubles only model open/close;
// browser focus containment, Escape and background isolation require native QA.
const dialogMethods = new Map(["showModal", "close"].map((name) => [name, Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name)]));
Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value() { this.setAttribute("open", ""); } });
Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value() { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); } });
afterAll(() => {
  for (const [name, descriptor] of dialogMethods) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else delete HTMLDialogElement.prototype[name];
  }
});

beforeEach(() => {
  vi.mocked(loadSettings).mockResolvedValue({
    profile: { first_name: "Private", last_name: "Person", email: "private@example.invalid", phone: null },
    sessions: [{ id: "private-session", device_info: "Private device", ip_address: "192.0.2.20", created_at: "2026-09-01", expires_at: "2026-09-28" }],
    sources: { sessions: "available" },
  });
  vi.mocked(downloadLocalFile).mockReset();
});

async function openSystem() {
  const user = userEvent.setup(); render(<Home />);
  await screen.findByRole("textbox", { name: "Prénom" });
  await user.click(screen.getByRole("tab", { name: "Système" }));
  return user;
}

describe("local Settings assistance", () => {
  it("shows truthful help without deployment fixtures or extra business calls", async () => {
    const user = await openSystem();
    await user.click(screen.getByText("Centre d’aide"));
    expect(screen.getByRole("dialog", { name: "Centre d’aide" })).toBeTruthy();
    expect(screen.getByText(/Cette page ne permet pas encore de les révoquer/)).toBeTruthy();
    expect(screen.getByText(/préférences Notifications, Apparence et Général ne sont pas encore disponibles/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Vider le cache" })).toBeNull();
    expect(loadSettings).toHaveBeenCalledTimes(1);
    expect(downloadLocalFile).not.toHaveBeenCalled();
  });

  it.each([['Préparer une demande de support', 'demande-support-settings.txt'], ['Signaler un problème', 'signalement-settings.txt']])("exports %s as local plain text without private bootstrap values", async (action, filename) => {
    const user = await openSystem();
    await user.click(screen.getByRole("button", { name: action }));
    await user.type(screen.getByRole("textbox", { name: "Votre message" }), "Une question <b>en texte</b>");
    await user.click(screen.getByRole("button", { name: "Télécharger la demande" }));
    expect(downloadLocalFile).toHaveBeenCalledTimes(1);
    const file = vi.mocked(downloadLocalFile).mock.calls[0][0];
    expect(file.name).toBe(filename); expect(file.type).toBe("text/plain;charset=utf-8");
    expect(file.content).toContain("Une question <b>en texte</b>");
    expect(file.content).not.toMatch(/Private|private-session|private@example|192\.0\.2/);
    expect(screen.getByRole("status").textContent).toContain("Aucun message n’a été envoyé");
    expect(screen.queryByRole("dialog")).toBeNull();
    const trigger = screen.getByRole("button", { name: action });
    expect(document.activeElement).toBe(trigger);
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Votre message" }).value).toBe("");
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });

  it("rejects whitespace-only messages and declares the length limit", async () => {
    const user = await openSystem();
    await user.click(screen.getByRole("button", { name: "Signaler un problème" }));
    const input = screen.getByRole("textbox", { name: "Votre message" });
    expect(input.maxLength).toBe(5000);
    await user.type(input, "   "); await user.click(screen.getByRole("button", { name: "Télécharger la demande" }));
    expect(screen.getByRole("alert").textContent).toMatch(/1 à 5 000/);
    expect(downloadLocalFile).not.toHaveBeenCalled();
  });

  it("keeps a failed export draft and supports retry without leaking the error", async () => {
    vi.mocked(downloadLocalFile).mockImplementationOnce(() => { throw new Error('private error'); });
    const user = await openSystem();
    await user.click(screen.getByRole("button", { name: "Signaler un problème" }));
    await user.type(screen.getByRole("textbox", { name: "Votre message" }), "My draft");
    await user.click(screen.getByRole("button", { name: "Télécharger la demande" }));
    expect(screen.getByRole("textbox", { name: "Votre message" }).value).toBe("My draft");
    expect(screen.getByRole("dialog", { name: "Signalement" }).contains(screen.getByRole("alert"))).toBe(true);
    expect(screen.getByRole("alert").textContent).not.toContain("private error");
    expect(screen.queryByRole("status")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Télécharger la demande" }));
    expect(screen.queryByRole("alert")).toBeNull(); expect(screen.getByRole("status")).toBeTruthy();
  });

  it("exports only the allowlisted diagnostic fields, never the draft or profile", async () => {
    const user = await openSystem();
    await user.click(screen.getByRole("button", { name: "Télécharger le diagnostic local" }));
    const report = JSON.parse(vi.mocked(downloadLocalFile).mock.calls[0][0].content);
    expect(Object.keys(report).sort()).toEqual(['browser', 'capabilities', 'generatedAt', 'module', 'operatingSystem']);
    expect(JSON.stringify(report)).not.toMatch(/Private|private-session|private@example|192\.0\.2|jsdom/);
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });

  it("reports unavailable diagnostic downloads without a success claim", async () => {
    vi.mocked(downloadLocalFile).mockImplementation(() => { throw new Error('secret'); });
    const user = await openSystem();
    await user.click(screen.getByRole("button", { name: "Télécharger le diagnostic local" }));
    expect(screen.getByRole("alert").textContent).toMatch(/diagnostic local n’a pas pu/);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("supports keyboard entry and has no serious accessibility violations", async () => {
    const user = await openSystem();
    const prepare = screen.getByRole("button", { name: "Préparer une demande de support" });
    prepare.focus(); await user.keyboard("{Enter}");
    expect(prepare.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Votre message" }));
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer" }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Votre message" }));
    const result = await axe(screen.getByRole("dialog", { name: "Demande de support" }));
    expect(result.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
  });

  it("names help, focuses its heading and restores the opener after Close", async () => {
    const user = await openSystem();
    const trigger = screen.getByRole("button", { name: "Centre d’aide" });
    await user.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Centre d’aide" }));
    await user.tab(); await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer" }));
    await user.click(screen.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });

  it("handles native cancellation and starts a blank draft on the next opening", async () => {
    const user = await openSystem();
    const trigger = screen.getByRole("button", { name: "Signaler un problème" });
    await user.click(trigger);
    await user.type(screen.getByRole("textbox", { name: "Votre message" }), "Discarded on close");
    fireEvent(screen.getByRole("dialog", { name: "Signalement" }), new Event("cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Votre message" }).value).toBe("");
    expect(downloadLocalFile).not.toHaveBeenCalled();
  });
});
