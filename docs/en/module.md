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

- System displays estimated local browser and operating-system families (MAIR-471), matching the reference information without its browser version, deployment fixtures or quotas. Unknown/inaccessible information remains explicit; no account data, storage or additional service call is needed.
- Form for first name, last name, email and phone.
- The Settings sidebar restores the reference's 44px link height and lateral shadow. Its mobile stacking remains below the published drawer close control. The short contract-backed profile retains its natural width: unsupported reference fields are not copied to force a scrollbar or visual equivalence.
- The shared navigation and page use the prototype's default 17px root scale and system font. Navigation retains the reference's standard small-text tokens; the existing Settings panel's larger labels remain scoped to that panel. The shared header keeps its rem-based sizing (68px at this default), rather than a fixed-height override. This is presentation only: saved font, theme and density preferences remain unavailable.
- Prototype-aligned icon tabs (two mobile, three intermediate, six desktop columns), a white selected pill with blue text, and a one/two-column contact form. Arrow keys, Home and End retain focus-following selection; decorative icons do not change accessible names. Only existing fields are displayed, not unsupported demo profile data.
- Save confirmation based on the profile read back by the BFF.
- One profile save at a time: the four fields and submit are locked while pending, even after switching tabs. A refused save keeps the draft and allows retry; a successful save displays the returned profile and releases the fields for new edits.
- An unusable successful profile response is not a confirmation: the draft and last confirmed identity remain intact. Explicit bootstrap recovery preserves dirty fields and independent save errors, adopts clean received fields, and never repeats a PATCH. Only a validated save response advances the confirmed baseline used by later reads.
- Session list in the Security tab with a separate unavailable state.
- System tab: reference-style named help/support/report dialogs with native modal focus containment, Escape/Close and opener focus restoration. Support/report preparation failures retain the draft for retry; successful preparation closes the dialog and only announces download initiation. Each new request opens blank. Truthful help, local text exports and a minimal browser diagnostic JSON remain available without automatic transmission.

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

Notifications, appearance and general preferences remain unavailable. System provides local assistance only, not server logs, deployment information or storage quotas. Security displays sessions without managing other settings. Preference adapters do not guarantee that the corresponding Core routes are deployed.

Support/report drafts accept 1–5,000 characters and remain in memory only; leaving the System tab or reloading discards them. Download failures keep the draft and allow retry. Review downloaded files before sharing them through your usual channel. No profile or session data is included automatically, and no support service is contacted. The diagnostic contains only the module name, generation time, estimated browser/OS families and object-URL capability. It does not collect raw user agents, account data, cookies, storage, page addresses or logs. Browser family detection is an estimate, not a device inventory.

## Developing or operating this module

The composed recovery/profile-confirmation candidate consumes published UI0.6.10.
Native actual390x844 checks retain dirty fields and the save error during GET-only
recovery; only a usable returned profile confirms a save. Later reads update clean
fields against that confirmation while preserving a new draft. The disposable
server restart and declared invalid/error response fixtures do not prove deployed
persistence. 150 Node and41 component tests, types/contract/lint/build pass locally;
actual required CI, integration and exact current-local delivery remain separate.

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
