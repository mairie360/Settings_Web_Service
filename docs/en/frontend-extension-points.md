# Frontend extension points while backend work is pending

The 11 October 2026 request authorizes preparing the remaining local-demo features on the frontend before the backend is implemented. Published SDKs, BFF/API sources, environment variables and RGAA configuration remain unchanged. These view ports are frontend interfaces, not new HTTP contracts. They have no production transport until a published operation is mapped to them.

## Expected integration

Map received identities, permissions and records from the future published SDK to these ports. Reject refused, empty, incomplete or mismatched receipts; never resolve a mutation until its server confirmation is verified. Keep requests scoped to the authenticated account. Do not insert simulator fixtures or a fallback HTTP endpoint into production.

Without a bridge, account changes, written reviews and secure downloads report unavailability and preserve the relevant draft. No simulated server success, account protection, current agent, deployed version, notification badge or persistence is manufactured. Passwords, one-time codes, recovery codes and photo previews stay in memory; leaving Security clears its secrets. Notification reads do not acknowledge anything automatically.

## Verification scope

Unit/component tests inject view ports solely to exercise the frontend confirmation/refusal/late-response behavior. Those tests do not certify a backend implementation, deployed authentication, roles, persistence or rollout. Existing business operations continue using their published SDKs.

## Module

`SettingsFeaturePort` in `src/lib/settings-features.ts` prepares preferences, professional profile fields, photo upload, password change, MFA challenge/confirmation/disable/recovery, session revocation and instance updates. `SettingsPendingFeatures` holds drafts through tab changes. The current page supplies no bridge. Preference values are explicitly draft UI defaults. Service catalogs, existing MFA state and account data must come from the future backend. Instance update controls are visible only after the existing Login role read confirms administration. Current-session identity is not inferred from IP/device/time.
