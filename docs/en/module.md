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
- Prototype-aligned icon tabs (two mobile, three intermediate, six desktop columns), a white selected pill with blue text, and a one/two-column contact form. Arrow keys, Home and End retain focus-following selection; decorative icons do not change accessible names. Only existing fields are displayed, not unsupported demo profile data.
- Save confirmation based on the profile read back by the BFF.
- One profile save at a time: the four fields and submit are locked while pending, even after switching tabs. A refused save keeps the draft and allows retry; a successful save displays the returned profile and releases the fields for new edits.
- An unusable successful profile response is not a confirmation: the draft and last confirmed identity remain intact. Explicit bootstrap recovery preserves dirty fields and independent save errors, adopts clean received fields, and never repeats a PATCH. Only a validated save response advances the confirmed baseline used by later reads.
- V2 shell (MAIR-851): lib 2.x `AccessibleShell`, title « Paramètres » with today's date, six tabs in the mock-up order (Profil, Sécurité, Sessions, Notifications, Apparence, Général); an old `?tab=system` or `system-assistance` link opens Profil. The interface is always light, whatever theme is stored. Before any confirmed profile the page shows the loading panel, then « Profil temporairement indisponible » with « Réessayer » (the upstream reason is never shown). Receipts are lib toasts at the top right (5 s for a success, closable, Escape).
- Profile tab V2 (MAIR-864): one « Informations personnelles » card (first / last name, e-mail / phone), the current password when the e-mail changes, « N champs modifiés. » with Annuler (restores the saved values) and Enregistrer. Errors are shown under their field (local checks and the BFF's field details) with the « Profil non enregistré » toast, and the first field in error takes the focus; any other refusal is the « Enregistrement impossible » toast, the input is kept. Photo, department, position and bio wait for their contract (MAIR-354, MAIR-443).
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

Notifications, appearance and general preferences use the three published PATCH operations. Each section hydrates confirmed values, preserves inherited defaults and dirty edits, sends only its changed fields, and validates the returned snapshot before confirming success. Unavailable source flags disable saving until a successful refresh. System provides local assistance only, not server logs, deployment information or storage quotas. Security displays sessions without managing other settings. Preference adapters do not guarantee that the corresponding Core routes are deployed.


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
