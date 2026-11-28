# Settings_Web_Service — Module overview

## Coherent bootstrap reads — MAIR-456

The frontend checks the consumed profile, session array, session field types
and declared source availability before replacing any confirmed data. A
malformed successful read exposes a controlled French retry message, never a
raw JavaScript error or invented empty session list. Initial loading stays
unavailable; refreshing keeps the confirmed identity, clean fields, latest
dirty edits, current tab and independent save/logout errors. A deliberate valid
GET merges against the unchanged confirmed baseline; no save is replayed.
Optional phone/revocation and invalid string-date display fallbacks retain
their existing contract semantics. Routes, permissions and API/BFF are unchanged.

## Reconnection — MAIR-405

Visitors without a cookie or with an expired session are sent to configured
Login before Settings renders. During a read/save, a401 triggers the existing
Login logout/reconnection handoff once; the failed save is never automatically
replayed. A403 or unavailable service still preserves the draft and normal
recovery. No storage-based success or fictitious session is introduced. Missing
Login configuration reports a controlled unavailability. This frontend check
does not certify token authenticity, server revocation or deployed permissions.

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Let users update contact details and inspect sessions. The interface explicitly identifies settings that are not yet available.

## Audience and value

Users managing their personal profile.

Business domain: Personal settings.

## Available capabilities

- Form for first name, last name, email and phone. The inputs carry the constraints of the published contract (names up to 64 characters without `<` or `>`, e-mail up to 320, phone up to 32 characters made of digits, spaces, `.`, `-`, `(`, `)` and an optional leading `+`), with help text.
- Changing the e-mail address asks for the current password (MAIR-511): the field appears only while the typed address differs from the confirmed one (trimmed, case-insensitive), is sent once as `current_password`, is never kept with the profile and is cleared on revert or after a confirmed save. Without it, the save is refused locally with no network call. A refusal of the BFF is explained in French: one line per validation detail labelled with its field, a wrong current password (403) and an address already in use (409) have their own messages.
- The Settings sidebar restores the reference's 44px link height and lateral shadow. Its mobile stacking remains below the published drawer close control. The short contract-backed profile retains its natural width: unsupported reference fields are not copied to force a scrollbar or visual equivalence.
- The shared navigation and page use the prototype's default 17px root scale and system font. Navigation retains the reference's standard small-text tokens; the existing Settings panel's larger labels remain scoped to that panel. The shared header keeps its rem-based sizing (68px at this default), rather than a fixed-height override. Appearance preferences now hydrate from the published bootstrap and are saved through its generated PATCH operation; the appearance preview remains local until confirmation.
- Prototype-aligned icon tabs (two mobile, three intermediate, six desktop columns), the selected tab underlined, and a one/two-column contact form. Arrow keys, Home and End retain focus-following selection; decorative icons do not change accessible names. Only existing fields are displayed, not unsupported demo profile data.
- Save confirmation based on the profile read back by the BFF.
- Photo, service, function and biography (Figma « P3 · Changer la photo de profil »): the « Photo de profil » field (lib `ProfilePhotoField`) takes a JPG or PNG of at most 2 MB (« Formats acceptés : JPG, PNG. Taille max : 2 Mo. »), cropped to its centred square and compressed in the browser to a 256 × 256 WebP of at most 100 KiB, then sent with « Enregistrer » after the other fields (`PUT` / `DELETE /settings/profile/photo`); « Retirer » removes it. « Service » is read-only (« Défini par l’administration. »), « Fonction » is one line of 100 characters, « Bio » 1000 characters; blank values remove them.
- One profile save at a time: the four fields and submit are locked while pending, even after switching tabs. A refused save keeps the draft and allows retry; a successful save displays the returned profile and releases the fields for new edits.
- An unusable successful profile response is not a confirmation: the draft and last confirmed identity remain intact. Explicit bootstrap recovery preserves dirty fields and independent save errors, adopts clean received fields, and never repeats a PATCH. Only a validated save response advances the confirmed baseline used by later reads.
- V2 shell (MAIR-851): lib 2.x `AccessibleShell`, title « Paramètres » with today's date, six tabs in the mock-up order (Profil, Sécurité, Sessions, Notifications, Apparence, Général); an old `?tab=system` or `system-assistance` link opens Profil. The interface is always light, whatever theme is stored. Before any confirmed profile the page shows the loading panel, then « Profil temporairement indisponible » with « Réessayer » (the upstream reason is never shown). Receipts are lib toasts at the top right (5 s for a success, closable, Escape).
- Profile tab V2 (MAIR-864): one « Informations personnelles » card (first / last name, e-mail / phone), the current password when the e-mail changes, « N champs modifiés. » with Annuler (restores the saved values) and Enregistrer. Errors are shown under their field (local checks and the BFF's field details) with the « Profil non enregistré » toast, and the first field in error takes the focus; any other refusal is the « Enregistrement impossible » toast, the input is kept. Photo, department, position and bio wait for their contract (MAIR-354, MAIR-443).
- Security tab (MAIR-876): password, then « Double authentification » (MAIR-807: on / off status and remaining backup codes; activation with a QR code and a key to type, then the first code; ten backup codes shown once with copy and download and a mandatory « J’ai enregistré mes codes » box; regeneration with a code of the application; deactivation with the password and a code; « Votre mairie impose la double authentification. » when Core refuses the deactivation) and « Passkeys » (MAIR-811: list with manager and dates, named creation through the browser, deletion after confirmation; a refusal of the mairie and a browser without WebAuthn are stated).
- Session list in its own Sessions tab with a separate unavailable state.

## Typical workflow

1. Load `/settings/bootstrap`.
2. Edit contact details and submit `/settings/profile`.
3. Display the profile read back from Core and inspect available sessions.

## Role within Mairie360

Associated repositories: [BFF_Settings](https://github.com/mairie360/BFF_Settings).

This repository contains the browser interface and its Next.js adapters. The associated BFF supplies business data and coordinates its sources.

## Data and current state

The profile comes from Core `/api/v1/user/me/`; sessions come from `/api/v1/sessions/`. Fields are `first_name`, `last_name`, `email` and `phone`. The session schema retains displayable information and removes internal fields. The BFF stores no preferences locally.

## Scope and limitations

Notifications, Apparence and Général (MAIR-902, MAIR-912, MAIR-921) use the three published PATCH operations. A switch, a list (font, density) or the text-size slider (14 to 24 px, sent once released) saves at once and confirms with a toast; a refusal brings the confirmed value back and shows « Enregistrement impossible. ». « Langue et région » (language, time zone, date format, home page) is a form with Annuler / Enregistrer and the count of changed fields. `null` reads as the account default. An unavailable section shows « Préférences indisponibles » with « Réessayer » and locks its controls, as does a foreground read. Preference adapters do not guarantee that the corresponding Core routes are deployed.


## Developing or operating this module

The composed recovery/profile-confirmation candidate consumes published UI0.6.10.
Native actual390x844 checks retain dirty fields and the save error during GET-only
recovery; only a usable returned profile confirms a save. Later reads update clean
fields against that confirmation while preserving a new draft. The disposable
server restart and declared invalid/error response fixtures do not prove deployed
persistence. 150 Node and41 component tests, types/contract/lint/build pass locally;
actual required CI, integration and exact current-local delivery remain separate.

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.


Accessibility (MAIR-482)

Status regions remain mounted empty before announcements; saving is confirmed only after the server response. Visible loading text is retained and a persistent region announces reads.


## Shared visual direction — MAIR-547

Approved light option 1: shared tokens and font, accessible navigation, and preserved business layouts. See the [visual QA](../qa/design-qa.md) for evidence, checks, and RGAA limitations.

### Sessions, password and alerts (MAIR-892, MAIR-876)

- Sessions: « Sessions actives » marks this device (« Cet appareil », never revocable). Any other active session is ended after a confirmation; « Déconnecter les autres appareils » ends them all but this one and says how many. « Historique des connexions » lists the ended or expired sessions. A session already ended (404) or the session of the page (409) is explained in French.
- Security: the password is changed through BFF_Settings (8 to 255 characters, different from the current one); a wrong current password, too many attempts or a refused new password are explained in French, and the other sessions are closed by Core. « Alertes de connexion » sends an e-mail at every new sign-in.
- Notifications gains « Mises à jour de la plateforme »; Général gains « Sauvegarde automatique des brouillons » (on by default).

### V2.1 layout (MAIR-1125)

- A header band names the agent (name, « Paramètres du compte », then « function · service · e-mail », « Agent » without a function, and the stored photo) on every tab and shows three tiles that open their tab: double authentication (Activée / Désactivée), active sessions, notifications switched on. They follow every change.
- The search field of the shared header searches every module (agents, projects and tasks, events, conversations and messages, courses) through `GET /search` of BFF_Settings from 2 characters on. Results are grouped by module and each one opens its module (project, task, event, conversation, course) through the link the library builds from the other fronts' URLs; a module that does not answer is named, and a refused search says « La recherche est indisponible pour le moment. ». Settings itself is not searched: there is nothing to open on this page.
- The tabs are a floating bar whose active tab is a sliding pill (lib `Tabs` `variant="pill"`), sticky at the top of the page; every panel has its icon; the « Annuler / Enregistrer » bar of Profil and « Langue et région » stays visible.
- Profile layout of the artifact: two columns from 1180 px, the « Photo de profil » card (photo field, accepted formats, « Aperçu dans l’annuaire » with the avatar, the name and « function · service » following the draft) beside « Informations personnelles » (fields on three columns, « * » on the required ones, no extra hint except the biography count « 1000 caractères maximum (n / 1000). »). Who sees these details is said once by the card description. The save bar sticks a little above the bottom edge, stands out once something changed, and the page keeps room under it so it never hides the field being edited. The shell header shows the function (« Agent » without one) under the name (lib 2.8.0).

- Sessions V2.1 (MAIR-1126): four cards above the lists (« Connexions actives », other connected devices, « Historique des sessions », location of this device: « Non disponible », the BFF has none yet), and a click on a session opens its detail in a centred window, with « Déconnecter cette session » for another active session (confirmed above the window).

- Setting cards and protection score (MAIR-1127): every switch shows its icon (notification types in the colour of their module). The Security tab starts with « Protection du compte »: a score out of three (double authentication, sign-in alerts, at most three active sessions) with « Bien protégé », « Correct » or « À renforcer », then the connected devices and « Gérer », which opens Sessions.
- Artifact layout (MAIR-1258, lib 2.9.0): Security is on two columns from 1180 px, the password form beside « Protection du compte », the second factor, sign-in alerts and passkeys below. Sessions is one « Sessions » panel (« Appareils connectés à votre compte. Si vous ne reconnaissez pas une session, déconnectez-la puis changez votre mot de passe. ») with an « Actives (n) » / « Historique (n) » switch (lib `SegmentedControl`, n = the rows of that list, no count when it cannot be read); the history table is « Historique des sessions ». The indicator labels keep « Connexions actives » / « Historique des sessions » (a label starting with « sessions » trips ZAP rule 10031).
- Lora (MAIR-1128): « Police de caractères » offers Police système, Geist, Atkinson Hyperlegible and Lora. The four fonts are named by lib-components 2.3.1, so a choice looks the same in every front; Atkinson Hyperlegible and Lora are loaded by the page.
