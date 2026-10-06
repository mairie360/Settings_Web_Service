-- Seed minimal pour les tests isolés (performance / sécurité) du front Settings.
-- L'utilisateur 2 est celui référencé par les JWT de test (claim sub = "2") :
--   * load-test.js le signe dynamiquement et l'envoie en cookie accessToken,
--   * docker-compose-security.yml injecte un cookie statique via le replacer ZAP.
INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES (2, 'Perf', 'Tester', 'perf-tester@mairie360.fr', 'dummy', 'active')
ON CONFLICT (id) DO NOTHING;
-- Core API >= 1.1.1 exige au moins un rôle sur l'utilisateur pour GET /user/me
-- (sinon 502 côté BFF Settings, donc sur /settings/bootstrap).
INSERT INTO user_roles (user_id, role_id)
SELECT 2, r.id FROM roles r WHERE lower(r.name) = 'user'
ON CONFLICT DO NOTHING;
-- User 3 is only used by the profile-saved state of rgaa.yaml (accessibility stack): saving the
-- profile changes it, and the other states, played in parallel as user 2, must not see that change.
INSERT INTO users (id, first_name, last_name, email, password, status)
VALUES (3, 'Rgaa', 'Editor', 'rgaa-editor@mairie360.fr', 'dummy', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT 3, r.id FROM roles r WHERE lower(r.name) = 'user'
ON CONFLICT DO NOTHING;
