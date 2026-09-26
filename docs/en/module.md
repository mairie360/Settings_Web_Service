# Settings_Web_Service — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Let users update contact details and inspect sessions. The interface explicitly identifies settings that are not yet available.

## Audience and value

Users managing their personal profile.

Business domain: Personal settings.

## Available capabilities

- Form for first name, last name, email and phone.
- Save confirmation based on the profile read back by the BFF.
- Session list in the Security tab with a separate unavailable state.
- System tab: truthful help, local support/report text downloads and a minimal browser diagnostic JSON. Files are not sent automatically.

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

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
