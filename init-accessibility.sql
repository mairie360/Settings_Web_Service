-- Data of the RGAA states of rgaa.yaml (MAIR-316), loaded by the seeder-a11y service of
-- docker-compose-accessibility.yml after init-test.sql. The ZAP / k6 stacks do not load it.
-- Ids start at 30 so that they never clash with init-test.sql. Users and roles are inserted in one
-- transaction: otherwise a deferred trigger gives the new users the Guest role. Dates are fixed
-- (the engine fixes the browser clock at 2026-01-15T09:00+01:00).
BEGIN;

-- 30: only used by profile-saved, which changes the profile. The states run in parallel, and the
-- ones played as user 2 must not see that change.
-- 31: an Admin, whose Système tab also shows the instance updates.
INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES
  (30, 'Rgaa', 'Editor', 'rgaa-editor@mairie360.fr', 'dummy', 'active'),
  (31, 'Rgaa', 'Admin', 'rgaa-admin@mairie360.fr', 'dummy', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 30, r.id FROM roles r WHERE r.name = 'User'
UNION ALL
SELECT 31, r.id FROM roles r WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Two open sessions of user 2, so that the Sécurité tab shows a list and its revoke dialog.
INSERT INTO sessions (id, user_id, token_hash, device_info, ip_address, created_at, expires_at)
VALUES
  ('3a0e6c1e-0000-4000-8000-000000000001', 2, 'rgaa-session-1', 'Firefox 140 sur Windows', '192.0.2.10', '2026-01-14T08:30:00+01:00', '2099-01-01T00:00:00+00:00'),
  ('3a0e6c1e-0000-4000-8000-000000000002', 2, 'rgaa-session-2', 'Safari sur iPhone', '192.0.2.11', '2026-01-12T18:05:00+01:00', '2099-01-01T00:00:00+00:00')
ON CONFLICT (id) DO NOTHING;

COMMIT;
