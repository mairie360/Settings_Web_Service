import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { loadSettings, saveProfile } from "@/lib/settings-api";

vi.mock("@/lib/settings-api", () => ({
  loadSettings: vi.fn(),
  saveProfile: vi.fn(),
}));

function bootstrap(overrides = {}) {
  return {
    profile: {
      first_name: "Test",
      last_name: "User",
      email: "test@example.invalid",
      phone: null,
    },
    sessions: [],
    sources: { sessions: "available" },
    ...overrides,
  };
}

async function openSettings() {
  const user = userEvent.setup();
  render(<Home />);
  await screen.findByRole("textbox", { name: "Prénom" });
  return user;
}

beforeEach(() => {
  vi.mocked(loadSettings).mockResolvedValue(bootstrap());
  vi.mocked(saveProfile).mockImplementation(async (patch) => ({
    ...bootstrap().profile,
    ...patch,
  }));
});

describe("Settings page", () => {
  it("renders contract-backed profile fields without an invented session", async () => {
    await openSettings();

    expect(loadSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Test");
    expect(screen.getByRole("textbox", { name: "E-mail" }).value).toBe("test@example.invalid");
    expect(screen.getByRole("button", { name: "Enregistrer" }).disabled).toBe(true);
  });

  it("sends only changed profile fields and confirms the persisted result", async () => {
    const user = await openSettings();
    await user.clear(screen.getByRole("textbox", { name: "Prénom" }));
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(saveProfile).toHaveBeenCalledExactlyOnceWith({ first_name: "Updated" });
    expect(await screen.findByRole("status", { name: "" })).toHaveProperty(
      "textContent",
      "Votre profil a été enregistré.",
    );
    expect(screen.getByRole("button", { name: "Enregistrer" }).disabled).toBe(true);
  });

  it("retains an unsaved edit and shows an error when the BFF rejects it", async () => {
    vi.mocked(saveProfile).mockRejectedValue(new Error("Service indisponible"));
    const user = await openSettings();
    await user.clear(screen.getByRole("textbox", { name: "Prénom" }));
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Service indisponible");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Updated");
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
  });

  it.each([
    ["available", "Aucune session à afficher."],
    ["unavailable", "Les sessions sont temporairement indisponibles."],
  ])("shows the %s session state honestly", async (source, message) => {
    vi.mocked(loadSettings).mockResolvedValue(bootstrap({ sources: { sessions: source } }));
    const user = await openSettings();
    await user.click(screen.getByRole("button", { name: "Sécurité" }));

    expect(screen.getByText(message)).toBeTruthy();
  });

  it("keeps unsupported settings visibly unavailable", async () => {
    const user = await openSettings();
    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByText("Fonctionnalité indisponible")).toBeTruthy();
    expect(screen.getByText(/pas encore exposées par le contrat BFF publié/)).toBeTruthy();
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("has labeled controls, keyboard navigation and no serious axe violations", async () => {
    const user = await openSettings();
    const navigation = screen.getByRole("navigation", { name: "Paramètres" });
    expect(within(navigation).getByRole("button", { name: "Profil" })).toBeTruthy();
    await user.tab();
    expect(document.activeElement).toBe(within(navigation).getByRole("button", { name: "Profil" }));

    const results = await axe(document.querySelector("main"));
    expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
  });
});
