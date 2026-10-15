import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { InstanceProvider } from "@mairie360/front-kit/react";
import { loadSettings, saveProfile } from "@/lib/settings-api";
import { loadSessionRole } from "@/lib/session-role";
import { setBrowserFrontUrls } from "@/lib/front-urls";

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

async function openSettings({ role, timeZone = "UTC" } = {}) {
  const user = userEvent.setup();
  render(<InstanceProvider role={role} timeZone={timeZone}><Home /></InstanceProvider>);
  await screen.findByRole("textbox", { name: "Prénom" });
  return user;
}

beforeEach(() => {
  setBrowserFrontUrls({ ADMINISTRATION_FRONT_URL: "https://admin.test.example/" });
  vi.mocked(loadSettings).mockResolvedValue(bootstrap());
  vi.mocked(saveProfile).mockImplementation(async (patch) => ({
    ...bootstrap().profile,
    ...patch,
  }));
});

describe("Settings page", () => {
  it.each([
    ["notifications", "Notifications"],
    ["notification-preferences", "Notifications"],
    ['notifications\" onfocus=\"alert(1)', "Profil"],
  ])("reads bounded section links (%s) and writes the explicit preference URL", async (value, selected) => {
    window.history.replaceState(null, "", "/?tab=" + encodeURIComponent(value));
    try {
      const user = userEvent.setup();
      render(<Home />);
      const notificationTab = await screen.findByRole("tab", { name: "Notifications", exact: true });
      expect(screen.getByRole("tab", { name: selected, exact: true }).getAttribute("aria-selected")).toBe("true");
      expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(screen.getByRole("tab", { name: selected, exact: true }).id);
      expect(document.querySelector('[onfocus]')).toBeNull();
      await user.click(screen.getByRole("tab", { name: "Profil", exact: true }));
      await user.click(notificationTab);
      expect(new URLSearchParams(window.location.search).get("tab")).toBe("notification-preferences");
      expect(notificationTab.getAttribute("aria-selected")).toBe("true");
    } finally { window.history.replaceState(null, "", "/"); }
  });

  it.each([
    ["system", "Système"],
    ["system-assistance", "Système"],
    ['system" onfocus="alert(1)', "Profil"],
  ])("reads bounded system links (%s) and writes the assistance URL on keyboard selection", async (value, selected) => {
    window.history.replaceState(null, "", "/?event=12&tab=" + encodeURIComponent(value) + "#detail");
    try {
      const user = userEvent.setup();
      render(<Home />);
      const selectedTab = await screen.findByRole("tab", { name: selected, exact: true });
      expect(selectedTab.getAttribute("aria-selected")).toBe("true");
      expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(selectedTab.id);
      expect(document.querySelector('[onfocus]')).toBeNull();
      if (selected === "Système") expect(screen.getByRole("heading", { name: "Système et assistance" })).toBeTruthy();
      const profileTab = screen.getByRole("tab", { name: "Profil", exact: true });
      await user.click(profileTab);
      await user.keyboard("{End}");
      const systemTab = screen.getByRole("tab", { name: "Système", exact: true });
      expect(document.activeElement).toBe(systemTab);
      expect(systemTab.getAttribute("aria-selected")).toBe("true");
      expect(window.location.search).toBe("?event=12&tab=system-assistance");
      expect(window.location.hash).toBe("#detail");
      await user.click(profileTab);
      await user.click(systemTab);
      expect(new URLSearchParams(window.location.search).get("tab")).toBe("system-assistance");
    } finally { window.history.replaceState(null, "", "/"); }
  });

  it("keeps the empty live region mounted until a confirmed save, then clears it on editing", async () => {
    let confirm;
    vi.mocked(saveProfile).mockImplementation(() => new Promise(resolve => { confirm = resolve; }));
    const user = await openSettings();
    const announcement = screen.getAllByRole("status")[0];
    expect(announcement.textContent).toBe("");
    expect(announcement.getAttribute("aria-live")).toBe("polite");
    expect(announcement.getAttribute("aria-atomic")).toBe("true");
    await user.clear(screen.getByRole("textbox", { name: "Prénom" }));
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Enregistrer le profil" }));
    expect(screen.getAllByRole("status")[0]).toBe(announcement);
    expect(announcement.textContent).toBe("");
    await act(async () => confirm({ ...bootstrap().profile, first_name: "Updated" }));
    expect(screen.getAllByRole("status")[0]).toBe(announcement);
    expect(announcement.textContent).toBe("Votre profil a été enregistré.");
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), " draft");
    expect(screen.getAllByRole("status")[0]).toBe(announcement);
    expect(announcement.textContent).toBe("");
  });

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
    expect(screen.getByRole("button", { name: "Enregistrer le profil" }).disabled).toBe(true);
  });

  it("sends only changed profile fields and confirms the persisted result", async () => {
    const user = await openSettings();
    await user.clear(screen.getByRole("textbox", { name: "Prénom" }));
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Enregistrer le profil" }));

    expect(saveProfile).toHaveBeenCalledExactlyOnceWith({ first_name: "Updated" });
    await screen.findByText("Votre profil a été enregistré.");
    expect(screen.getAllByRole("status")[0]).toHaveProperty(
      "textContent",
      "Votre profil a été enregistré.",
    );
    expect(screen.getByRole("button", { name: "Enregistrer le profil" }).disabled).toBe(true);
  });

  it("retains an unsaved edit and shows an error when the BFF rejects it", async () => {
    vi.mocked(saveProfile).mockRejectedValue(new Error("Service indisponible"));
    const user = await openSettings();
    await user.clear(screen.getByRole("textbox", { name: "Prénom" }));
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Enregistrer le profil" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Service indisponible");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Updated");
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
  });

  it.each([
    ["incomplete object", {}],
    ["null", null],
    ["array", []],
    ["missing first name", { last_name: "Returned", email: "returned@example.invalid" }],
    ["non-string surname", { ...bootstrap().profile, last_name: 42 }],
    ["non-string email", { ...bootstrap().profile, email: false }],
    ["non-string phone", { ...bootstrap().profile, phone: 42 }],
    ["body-less response", undefined],
  ])("retains all four draft fields after an unusable %s confirmation and permits retry", async (_label, reply) => {
    vi.mocked(saveProfile).mockResolvedValueOnce(reply);
    const user = await openSettings();
    const draft = { first_name: "Draft", last_name: "Surname", email: "draft@example.invalid", phone: "+33987654321" };
    const fields = [["Prénom", "first_name"], ["Nom", "last_name"], ["E-mail", "email"], ["Téléphone", "phone"]];
    for (const [label, field] of fields) {
      fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value: draft[field] } });
    }
    // MAIR-511: a changed e-mail asks for the current password, sent once as current_password.
    fireEvent.change(screen.getByLabelText("Mot de passe actuel"), { target: { value: "secret" } });
    const payload = { ...draft, current_password: "secret" };
    await user.click(screen.getByRole("button", { name: "Enregistrer le profil" }));
    expect((await screen.findByRole("alert")).textContent).toBe("L’enregistrement du profil n’a pas été confirmé. Réessayez.");
    expect(saveProfile).toHaveBeenCalledExactlyOnceWith(payload);
    expect(screen.getByLabelText("Mot de passe actuel").value).toBe("secret");
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
    for (const [label, field] of fields) {
      expect(screen.getByRole("textbox", { name: label }).value).toBe(draft[field]);
      expect(screen.getByRole("textbox", { name: label }).disabled).toBe(false);
    }
    await user.click(screen.getByRole("tab", { name: "Sécurité", exact: true }));
    await user.click(screen.getByRole("tab", { name: "Profil", exact: true }));
    for (const [label, field] of fields) expect(screen.getByRole("textbox", { name: label }).value).toBe(draft[field]);
    vi.mocked(saveProfile).mockResolvedValueOnce({ ...draft, first_name: "Official", phone: null });
    await user.click(screen.getByRole("button", { name: "Enregistrer le profil" }));
    expect(saveProfile.mock.calls).toEqual([[payload], [payload]]);
    expect(screen.queryByLabelText("Mot de passe actuel")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Official");
    expect(screen.getByRole("textbox", { name: "Téléphone" }).value).toBe("");
    expect(screen.getByRole("button", { name: "Enregistrer le profil" }).disabled).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Votre profil a été enregistré.")).toBeTruthy();
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
    expect(screen.getByRole("button", { name: "Enregistrer le profil" }).disabled).toBe(false);

    let resolveSave;
    vi.mocked(saveProfile).mockImplementationOnce(() => new Promise((resolve) => { resolveSave = resolve; }));
    await user.click(screen.getByRole("button", { name: "Enregistrer le profil" }));
    expect(saveProfile).toHaveBeenCalledTimes(2);
    expect(saveProfile).toHaveBeenLastCalledWith({ first_name: "Updated" });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
    await act(async () => { resolveSave({ ...bootstrap().profile, first_name: "UPDATED", last_name: "USER" }); });
    expect(screen.getAllByRole("status")[0].textContent).toBe("Votre profil a été enregistré.");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("UPDATED");
    expect(screen.getByRole("textbox", { name: "Nom" }).value).toBe("USER");
    for (const label of ["Prénom", "Nom", "E-mail", "Téléphone"]) {
      expect(screen.getByRole("textbox", { name: label }).disabled).toBe(false);
    }
    await user.type(screen.getByRole("textbox", { name: "Prénom" }), " again");
    expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("UPDATED again");
    expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
    expect(screen.getByRole("button", { name: "Enregistrer le profil" }).disabled).toBe(false);
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
    const user = await openSettings({ timeZone: "Indian/Reunion" });
    await user.click(screen.getByRole("tab", { name: "Sécurité" }));

    const dates = document.querySelectorAll("time");
    expect(dates).toHaveLength(2);
    expect(dates[0].dateTime).toBe("2026-09-15T08:00:00Z");
    expect(dates[1].dateTime).toBe("2026-09-22T08:00:00Z");
    expect(dates[0].textContent).toBe(new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Indian/Reunion",
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

  it.each(["Notifications", "Apparence", "Général"])("shows the persisted %s controls with explicit save confirmation", async (tabName) => {
    const user = await openSettings();
    await user.click(screen.getByRole("tab", { name: tabName }));

    expect(screen.getByRole("heading", { name: tabName === "Notifications" ? "Préférences de notification" : tabName === "Général" ? "Préférences générales" : tabName })).toBeTruthy();
    expect(screen.getByText(/Vos modifications sont enregistrées uniquement après confirmation/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enregistrer les préférences" }).disabled).toBe(true);
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

for (const [role, unusedRoleResult, expected] of [['Admin', false, true], ['Guest', true, false], [undefined, true, false]]) {
  it(`administration follows the trusted SSR role ${role ?? 'missing claim'} without a role lookup`, async () => {
    vi.mocked(loadSessionRole).mockResolvedValueOnce(unusedRoleResult);
    await openSettings({ role });
    if (expected) expect(screen.getAllByRole('button', { name: 'Administration', exact: true }).length).toBeGreaterThan(0);
    else expect(screen.queryAllByRole('button', { name: 'Administration', exact: true })).toHaveLength(0);
    expect(loadSessionRole).not.toHaveBeenCalled();
    expect(loadSettings).toHaveBeenCalledTimes(1);
  });
}

it('an unavailable role endpoint cannot hide navigation confirmed by the Admin SSR claim', async () => {
  vi.mocked(loadSessionRole).mockRejectedValueOnce(Object.assign(new Error('Role endpoint unavailable'), { status: 503 }));
  await openSettings({ role: 'Admin' });
  expect(screen.getAllByRole('button', { name: 'Administration', exact: true }).length).toBeGreaterThan(0);
  expect(screen.getByRole('textbox', { name: 'Prénom' }).value).toBe('Test');
  expect(loadSessionRole).not.toHaveBeenCalled();
  expect(loadSettings).toHaveBeenCalledTimes(1);
});
