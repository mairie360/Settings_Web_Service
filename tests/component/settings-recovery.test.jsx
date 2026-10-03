import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { loadSettings, saveProfile } from "@/lib/settings-api";
import { logoutAndRedirect } from "@/lib/logout";

vi.mock("@/lib/settings-api", () => ({ loadSettings: vi.fn(), saveProfile: vi.fn() }));
vi.mock("@/lib/logout", () => ({ logoutAndRedirect: vi.fn() }));

const initial = { first_name: "Test", last_name: "User", email: "test@example.invalid", phone: null };
const labels = ["Prénom", "Nom", "E-mail", "Téléphone"];
const fields = ["first_name", "last_name", "email", "phone"];
const dto = (profile = initial, source = "unavailable") => ({ profile, sessions: [], sources: { sessions: source } });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
};
async function open() {
  render(<Home />);
  await screen.findByRole("textbox", { name: "Prénom" });
  return userEvent.setup();
}
function change(label, value) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
}
beforeEach(() => {
  vi.mocked(loadSettings).mockReset().mockResolvedValue(dto());
  vi.mocked(saveProfile).mockReset().mockImplementation(async patch => ({ ...initial, ...patch }));
  vi.mocked(logoutAndRedirect).mockReset().mockRejectedValue(new Error("Unavailable"));
});

it("recovers an initial refusal explicitly by keyboard, without an automatic read or save", async () => {
  vi.mocked(loadSettings).mockRejectedValueOnce(new Error("Lecture refusée"));
  render(<Home />);
  expect((await screen.findByRole("alert")).textContent).toBe("Lecture refusée");
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(loadSettings).toHaveBeenCalledTimes(1);
  const pending = deferred();
  vi.mocked(loadSettings).mockReturnValueOnce(pending.promise);
  await userEvent.setup().click(screen.getByRole("button", { name: "Réessayer" }));
  const button = screen.getByRole("button", { name: "Chargement…" });
  expect(button.disabled).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");
  act(() => { fireEvent.click(button); fireEvent.click(button); });
  expect(loadSettings).toHaveBeenCalledTimes(2);
  expect(saveProfile).not.toHaveBeenCalled();
  await act(async () => pending.reject(new Error("Encore refusée")));
  const retry = screen.getByRole("button", { name: "Réessayer" });
  retry.focus();
  await userEvent.setup().keyboard("{Enter}");
  await screen.findByRole("textbox", { name: "Prénom" });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(loadSettings).toHaveBeenCalledTimes(3);
  expect(saveProfile).not.toHaveBeenCalled();
});

it("preserves all four dirty fields, including pending edits, and blocks competing saves", async () => {
  const user = await open();
  labels.forEach((label, i) => change(label, ["Draft", "Draft surname", "draft@example.invalid", "+33123456789"][i]));
  const pending = deferred();
  vi.mocked(loadSettings).mockReturnValueOnce(pending.promise);
  const refresh = screen.getByRole("button", { name: "Actualiser les paramètres" });
  act(() => { fireEvent.click(refresh); fireEvent.click(refresh); });
  expect(loadSettings).toHaveBeenCalledTimes(2);
  const form = screen.getByRole("textbox", { name: "Prénom" }).closest("form");
  expect(form.getAttribute("aria-busy")).toBe("true");
  expect(screen.getByRole("button", { name: "Enregistrer" }).disabled).toBe(true);
  fireEvent.submit(form);
  expect(saveProfile).not.toHaveBeenCalled();
  change("Prénom", "Latest draft");
  await user.click(screen.getByRole("tab", { name: "Sécurité" }));
  await act(async () => pending.resolve(dto({ first_name: "Server", last_name: "Server surname", email: "server@example.invalid", phone: "+33987654321" }, "available")));
  expect(screen.getByText("Aucune session à afficher.")).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Sécurité" }).getAttribute("aria-selected")).toBe("true");
  await user.click(screen.getByRole("tab", { name: "Profil" }));
  const values = ["Latest draft", "Draft surname", "draft@example.invalid", "+33123456789"];
  labels.forEach((label, i) => expect(screen.getByRole("textbox", { name: label }).value).toBe(values[i]));
  await user.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(saveProfile).toHaveBeenCalledExactlyOnceWith(Object.fromEntries(fields.map((field, i) => [field, values[i]])));
});

it("updates clean fields from the response but retains dirty fields against the new confirmed baseline", async () => {
  await open();
  change("Prénom", "Draft");
  vi.mocked(loadSettings).mockResolvedValueOnce(dto({ ...initial, last_name: "Server", phone: "+33123456789" }));
  await userEvent.setup().click(screen.getByRole("button", { name: "Actualiser les paramètres" }));
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Nom" }).value).toBe("Server"));
  expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Draft");
  await userEvent.setup().click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(saveProfile).toHaveBeenCalledExactlyOnceWith({ first_name: "Draft" });
});

it("retains confirmed fields and drafts after read refusal and does not clear save errors on recovery", async () => {
  await open(); change("Prénom", "Draft");
  vi.mocked(saveProfile).mockRejectedValueOnce(new Error("Sauvegarde refusée"));
  await userEvent.setup().click(screen.getByRole("button", { name: "Enregistrer" }));
  await screen.findByText("Sauvegarde refusée");
  vi.mocked(loadSettings).mockRejectedValueOnce(new Error("Lecture refusée"));
  await userEvent.setup().click(screen.getByRole("button", { name: "Actualiser les paramètres" }));
  await screen.findByText("Lecture refusée");
  expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Draft");
  expect(screen.getByRole("textbox", { name: "Nom" }).value).toBe("User");
  await userEvent.setup().click(screen.getByRole("button", { name: "Actualiser les paramètres" }));
  await waitFor(() => expect(screen.queryByText("Lecture refusée")).toBeNull());
  expect(screen.getByText("Sauvegarde refusée")).toBeTruthy();
  expect(saveProfile).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Votre profil a été enregistré.")).toBeNull();
});

it("does not start reads during a save, even through a synchronous event", async () => {
  const pending = deferred();
  vi.mocked(saveProfile).mockReturnValueOnce(pending.promise);
  await open(); change("Prénom", "Draft");
  const refresh = screen.getByRole("button", { name: "Actualiser les paramètres" });
  act(() => { fireEvent.submit(screen.getByRole("textbox", { name: "Prénom" }).closest("form")); fireEvent.click(refresh); });
  expect(loadSettings).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Actualiser les paramètres" }).disabled).toBe(true);
  await act(async () => pending.resolve({ ...initial, first_name: "Draft" }));
  expect(screen.getByRole("button", { name: "Actualiser les paramètres" }).disabled).toBe(false);
});

it("aborts unmounted reads and ignores even a transport that resolves after abort", async () => {
  const pending = deferred();
  vi.mocked(loadSettings).mockReturnValueOnce(pending.promise);
  const view = render(<Home />);
  const signal = vi.mocked(loadSettings).mock.calls[0][0];
  view.unmount(); expect(signal.aborted).toBe(true);
  await open();
  await act(async () => pending.resolve(dto({ ...initial, first_name: "Stale" })));
  expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Test");
});

it("ignores StrictMode stale completion without unlocking its current pending read", async () => {
  const stale = deferred(), current = deferred();
  vi.mocked(loadSettings).mockReturnValueOnce(stale.promise).mockReturnValueOnce(current.promise);
  render(<StrictMode><Home /></StrictMode>);
  expect(loadSettings).toHaveBeenCalledTimes(2);
  expect(vi.mocked(loadSettings).mock.calls[0][0].aborted).toBe(true);
  await act(async () => stale.resolve(dto({ ...initial, first_name: "Stale" })));
  expect(screen.queryByRole("textbox", { name: "Prénom" })).toBeNull();
  expect(screen.getByRole("button", { name: "Chargement…" }).disabled).toBe(true);
  await act(async () => current.resolve(dto()));
  expect(screen.getByRole("textbox", { name: "Prénom" }).value).toBe("Test");
});

it("retains logout errors when editing or recovering reads", async () => {
  const user = await open();
  await user.click(screen.getByRole("button", { name: /compte|Test User/i }));
  await user.click(screen.getByText("Déconnexion", { exact: true }));
  await screen.findByText("La déconnexion est temporairement indisponible.");
  change("Prénom", "Draft");
  await user.click(screen.getByRole("button", { name: "Actualiser les paramètres" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Actualiser les paramètres" }).disabled).toBe(false));
  expect(screen.getByText("La déconnexion est temporairement indisponible.")).toBeTruthy();
});
