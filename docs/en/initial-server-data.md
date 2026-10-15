# Initial server data — MAIR-526

The protected Settings document reads the published bootstrap once through the existing generated SDK and contract-gated BFF proxy. The configured public origin is validated; the read uses the access cookie and `no-store`. Unknown fields are removed before the confirmed, validated data is passed to the client. No refresh token, transport headers or private upstream error is serialized.

The client displays this confirmed data in its first HTML and does not repeat the bootstrap on mount. Each new server render has an opaque instance key so data from a previous request/account is not reused. Existing foreground refresh and draft preservation continue inside that instance. The local `loading.tsx` provides a labelled busy state without relying on an unpublished library primitive.

Missing/expired access, invalid configuration, an incoherent response, HTTP refusal or an outage leave initial data absent. The established same-origin client transport then performs recovery; rendering never refreshes or sets cookies. Server page/loading code remains measured by Node/c8, client interactions by Vitest/V8, with the existing 60% gates and no new threshold exemption.

Tests exercise real server HTML, generated SDK/proxy transport, concurrent request isolation, invalid/refused data, hydration without duplicate reads, and foreground refresh. Laboratory tests do not certify deployed backend availability or full RGAA compliance.

Settings mutations require the existing SDK handlers; there is no native HTML submission endpoint. Their confirmed fields remain readable in server HTML, inside disabled fieldsets and non-form containers, with an explicit JavaScript notice. Hydration enables the controls and mounts POST forms with the existing same-origin JSON handlers attached. This prevents early native submissions or personal fields reaching a GET query without inventing a CSRF token or a fallback mutation route. Tests check the actual server DOM, hydrated sections and a profile edit reaching the unchanged SDK handler. No scanner rule or security gate is relaxed.
