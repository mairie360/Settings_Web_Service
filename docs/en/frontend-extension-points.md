# Frontend extension points while backend work is pending

The 11 October 2026 request authorizes preparing the remaining local-demo features on the frontend before the backend is implemented. Published SDKs, BFF/API sources, environment variables and RGAA configuration remain unchanged. These view ports are frontend interfaces, not new HTTP contracts. They have no production transport until a published operation is mapped to them.

## Expected integration

Map received identities, permissions and records from the future published SDK to these ports. Reject refused, empty, incomplete or mismatched receipts; never resolve a mutation until its server confirmation is verified. Keep requests scoped to the authenticated account. Do not insert simulator fixtures or a fallback HTTP endpoint into production.

Without a bridge, account changes, written reviews and secure downloads report unavailability and preserve the relevant draft. No simulated server success, account protection, current agent, deployed version, notification badge or persistence is manufactured. Passwords, one-time codes, recovery codes and photo previews stay in memory; leaving Security clears its secrets. Notification reads do not acknowledge anything automatically.

## Verification scope

Unit/component tests inject view ports solely to exercise the frontend confirmation/refusal/late-response behavior. Those tests do not certify a backend implementation, deployed authentication, roles, persistence or rollout. Business operations use their published SDKs. Network tests exercise the real generated preference operations through the contract proxy; component tests cover unavailable sources, invalid receipts, null/default choices, read/write exclusion, preservation of dirty edits and account changes. These checks do not constitute a deployed persistence test.

## Module

`SettingsFeaturePort` in `src/lib/settings-features.ts` prepares preferences, professional profile fields, photo upload, password change, MFA challenge/confirmation/disable/recovery, session revocation and instance updates. `SettingsPendingFeatures` holds the pending account-feature drafts through tab changes; `SettingsPreferencesPanel` owns the confirmed and draft preference snapshots. The page now connects preference editing directly to the generated `patchSettingsAppearance`, `patchSettingsGeneral` and `patchSettingsNotifications` operations from the pinned published Settings SDK. Bootstrap values and source flags hydrate the three sections. Null or absent values retain an explicit inherited-default choice; the contract does not define concrete fallback values. Each tab submits only changed fields and accepts a complete validated response snapshot. Other feature ports still have no production transport. Service catalogs, existing MFA state and account data must come from the future backend. Instance update controls are visible only after the existing Login role read confirms administration. Current-session identity is not inferred from IP/device/time.

## Published contract limits (15 October 2026)

The pinned package `@mairie360/bff-settings-openapi@0.0.0-dev.6d726190fa0a1d5d4db5a7e0c500b46bd832ca41` publishes bootstrap and PATCH profile/appearance/general/notifications. It contains no photo-upload, password-change, MFA, professional-profile, instance-update or session-revocation operation. Those controls continue to report unavailability after local validation; their injected ports are test extension points only. No production route or model has been invented for them.

The user timezone remains uneditable. General preference patches never include a timezone field unless a real future product decision explicitly introduces such editing. Foreground reads are held while preferences are being written, and preference saves wait for active reads. A foreground profile-identity change discards the old account's preference state. The profile contract exposes no stable account identifier, so this boundary uses the confirmed email change, as the existing profile refresh does; it cannot distinguish two accounts sharing an indistinguishable published profile identity.
