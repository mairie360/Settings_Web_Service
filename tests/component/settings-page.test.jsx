import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
  it("renders six recognizable tabs with hidden icons and a responsive four-field grid", async () => {
    await openSettings();
    const navigation = screen.getByRole("tablist", { name: "Paramètres" });
    expect(navigation.className).toBe("settings-tabs");
    for (const label of ["Profil", "Sécurité", "Notifications", "Apparence", "Général", "Système"]) {
      const tab = within(navigation).getByRole("tab", { name: label, exact: true });
      expect(tab.querySelector('svg[aria-hidden="true"][focusable="false"]')).toBeTruthy();
      expect(tab.className).toBe("settings-tab");
      expect(tab.getAttribute("aria-controls")).toBe(tab.getAttribute("aria-selected") === "true"
        ? tab.id.replace("-tab-", "-panel-") : null);
    }
    const grid = screen.getByRole("textbox", { name: "Prénom" }).closest(".settings-profile-fields");
    expect(within(grid).getAllByRole("textbox")).toHaveLength(4);
    expect(screen.getByRole("tabpanel").className).toBe("settings-panel");
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });

  it("keeps focus-following keyboard selection after adding decorative icons", async () => {
    const user = await openSettings();
    const tabs = within(screen.getByRole("tablist", { name: "Paramètres" })).getAllByRole("tab");
    await user.click(tabs[0]);
    for (const [key, selected] of [["{ArrowLeft}", 5], ["{ArrowRight}", 0], ["{End}", 5], ["{Home}", 0], ["{ArrowRight}", 1]]) {
      await user.keyboard(key);
      expect(document.activeElement).toBe(tabs[selected]);
      expect(tabs[selected].getAttribute("aria-selected")).toBe("true");
      expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(tabs[selected].id);
    }
    expect(loadSettings).toHaveBeenCalledTimes(1);
    expect(saveProfile).not.toHaveBeenCalled();
  });

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

  it("locks one pending save across tab returns, retains a refused draft and unlocks a confirmed retry", async () => {
    let rejectSave;
    vi.mocked(saveProfile).mockImplementationOnce(() => new Promise((resolve, reject) => { rejectSave = reject; }));
    const user = await openSettings();
    const firstName = screen.getByRole("textbox", { name: "Prénom" });
    await user.clear(firstName); await user.type(firstName, "Updated");
    const form = firstName.closest("form");
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(saveProfile).toHaveBeenCalledExactlyOnceWith({ first_name: "Updated" });
    expect(form.getAttribute("aria-busy")).toBe("true");
    for (const label of ["Prénom", "Nom", "E-mail", "Téléphone"]) {
      expect(screen.getByRole("textbox", { name: label }).disabled).toBe(true);
    }
    await user.type(firstName, "Discarded edit");
    expect(firstName.value).toBe("Updated");
    expect(screen.getByRole("button", { name: "Enregistrement…" }).disabled).toBe(true);
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Sécurité" }));
    await user.click(screen.getByRole("tab", { name: "Profil" }));
    expect(screen.getByRole("textbox", { name: "Prénom" }).disabled).toBe(true);
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Updated");
    await act(async () => { rejectSave(new Error("Service indisponible")); });
    expect(screen.getByRole("alert").textContent).toBe("Service indisponible");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Updated");
    expect(screen.getByRole("button", { name: "Enregistrer" }).disabled).toBe(false);

    let resolveSave;
    vi.mocked(saveProfile).mockImplementationOnce(() => new Promise((resolve) => { resolveSave = resolve; }));
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(saveProfile).toHaveBeenCalledTimes(2);
    expect(saveProfile).toHaveBeenLastCalledWith({ first_name: "Updated" });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
    await act(async () => { resolveSave({ ...bootstrap().profile, first_name: "UPDATED", last_name: "USER" }); });
    expect(screen.getByRole("status").textContent).toBe("Votre profil a été enregistré.");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("UPDATED");
    expect(screen.getByRole("textbox", { name: "Nom" }).value).toBe("USER");
    for (const label of ["Prénom", "Nom", "E-mail", "Téléphone"]) {
      expect(screen.getByRole("textbox", { name: label }).disabled).toBe(false);
    }
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), " again");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("UPDATED again");
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
    expect(screen.getByRole("button", { name: "Enregistrer" }).disabled).toBe(false);
  });

  it.each([
    ["available", "Aucune session à afficher."],
    ["unavailable", "Les sessions sont temporairement indisponibles."],
  ])("shows the %s session state honestly", async (source, message) => {
    vi.mocked(loadSettings).mockResolvedValue(bootstrap({ sources: { sessions: source } }));
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: "Sécurité" }));

    expect(screen.getByText(message)).toBeTruthy();
  });

  it("formats real session timestamps without exposing raw ISO values", async () => {
    vi.mocked(loadSettings).mockResolvedValue(bootstrap({
      sessions: [{
        id: "session-1",
        device_info: "Firefox sur Linux",
        ip_address: "192.0.2.10",
        created_at: "2026-09-15T08:00:00Z",
        expires_at: "2026-09-22T08:00:00Z",
        revoked_at: null,
      }],
    }));
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: "Sécurité" }));

    const dates = document.querySelectorAll("time");
    expect(dates).toHaveLength(2);
    expect(dates[0].dateTime).toBe("2026-09-15T08:00:00Z");
    expect(dates[1].dateTime).toBe("2026-09-22T08:00:00Z");
    expect(dates[0].textContent).toBe(new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium", timeStyle: "short",
    }).format(new Date(dates[0].dateTime)));
    expect(screen.queryByText("2026-09-15T08:00:00Z")).toBeNull();
  });

  it("does not invent dates for invalid session timestamps", async () => {
    vi.mocked(loadSettings).mockResolvedValue(bootstrap({
      sessions: [{
        id: "session-2",
        device_info: "Firefox sur Linux",
        ip_address: "192.0.2.10",
        created_at: "2026-02-30T08:00:00Z",
        expires_at: "not-a-date",
        revoked_at: null,
      }],
    }));
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: "Sécurité" }));

    expect(screen.getAllByText("Date indisponible")).toHaveLength(2);
    expect(document.querySelectorAll("time")).toHaveLength(0);
    expect(screen.queryByText("not-a-date")).toBeNull();
  });

  it.each(["Notifications", "Apparence", "Général"])("keeps %s visibly unavailable without technical jargon", async (tabName) => {
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: tabName }));

    expect(screen.getByRole("heading", { name: tabName })).toBeTruthy();
    expect(screen.getByText("Fonctionnalité indisponible")).toBeTruthy();
    expect(screen.getByText(/ne sont pas encore disponibles/)).toBeTruthy();
    expect(document.querySelector("main").textContent).not.toContain("BFF");
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("has labeled controls, keyboard navigation and no serious axe violations", async () => {
    const user = await openSettings();
    const navigation = screen.getByRole("tablist", { name: "Paramètres" });
    const profileTab = within(navigation).getByRole("tab", { name: "Profil" });
    for (let index = 0; index < 12 && document.activeElement !== profileTab; index += 1) {
      await user.tab();
    }
    expect(document.activeElement).toBe(profileTab);

    const results = await axe(document.querySelector("main"));
    expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
  });
});
