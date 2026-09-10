# AGENTS.md - Oxalate Frontend

Vite + React 19 + TypeScript single-page application for the Oxalate Portal.

## 1. Product context (read this first)

Oxalate Portal is a **membership portal for a scuba diving club/organization**. This repository is the entire user interface; all data, business rules, and
authorization live in the
[`oxalate-backend`](https://github.com/Oxalate-Portal/oxalate-backend) REST service.

The UI serves four audiences, and the same build serves every deployment:

| Role             | What the UI offers                                                                                                                                                                                                                            |
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Anonymous        | Public CMS pages (including the front page), language selection, registration, login, password recovery, and the blog when enabled.                                                                                                           |
| `ROLE_USER`      | Dive event browsing and sign-up, waiting lists, past events and yearly dive statistics, own profile, certificates, payments/memberships, comments, notifications.                                                                             |
| `ROLE_ORGANIZER` | Everything above, plus creating/editing dive events, recording per-participant dive counts, managing pages they have write access to, and viewing any user's details (contact, next of kin, payment status, certificates) for safety reasons. |
| `ROLE_ADMIN`     | Everything above, plus the Administration console: members, roles/statuses, payments, memberships, portal configuration, page groups, comment moderation, tags, tokens, files, statistics, and the audit trail.                               |

`documentation/user/index.md` is the closest thing to a product requirements document: it walks through every screen per role with screenshots. Read it before
changing user-visible behaviour. `CUSTOMIZATION.md` describes how one image is re-branded per organization at runtime.

### Product invariants the UI must uphold

- **Nothing is hardcoded that the organization can configure.** Event limits, payment/membership rules, enabled languages, timezone, and feature switches all
  come from the backend at runtime (§4).
- **Terms gate**: if `userSession && !userSession.approvedTerms`, only `/` and the user profile route render; everything else redirects to `/` and `AcceptTerms`
  is shown. Do not add routes that bypass this. A `HealthStatementConfirmation`
  flow gates event participation similarly.
- **Privacy override for organizers is deliberate**: organizers see full user details so they can verify competence and reach next of kin in an accident. Do not
  "fix" this as a leak.
- **Anonymized accounts still appear** in event lists and statistics with their personal data stripped. Never assume a user row implies personal data is
  present.
- **Every visible string is translated** into all five locales (§8).

## 2. Quick orientation

- App bootstrap is `src/index.tsx`: `I18nextProvider` → `SessionProvider` → `BrowserRouter` → `App`.
- `src/App.tsx` is the routing hub, wraps everything in an Ant Design dark-theme `ConfigProvider`, and always renders
  `NavigationBar`, `OxalateFooter`, and `AuthVerify`. Route availability is not static: it depends on `useSession()`
  state plus portal configuration values such as `membership-type`, `commenting-enabled`, and `blog-enabled`.
- Major feature areas live under `src/components/`: `Administration`, `Blogging`, `Certificate`, `Commenting`,
  `DiveEvent`, `Notification`, `Page`, `Payment`, `Register`, `Statistics`, `User`, and `main` (shell: navigation bar, footer, home, login, terms). They are
  re-exported through `src/components/index.ts`.

### Route map (`src/App.tsx`)

| Area           | Routes                                                                                                                                                                                                                        | Guard                                         |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| Public         | `/`, `/pages/:paramId`, `/login`, `/registration`, `/auth/register`, `/auth/lost-password`, `/auth/new-password/:token`, `/auth/reconfirm`, `/auth/email-change`                                                              | none                                          |
| Blog           | `/blog`                                                                                                                                                                                                                       | none, rendered only if `blog-enabled`         |
| Dive events    | `/events/main`, `/events/past`, `/events/dive-stats`, `/events/:paramId`, `/events/:paramId/show`, `/events/:paramId/set-dives`                                                                                               | `PrivateRoute`                                |
| Dive events    | `/events/add`, `/events/:paramId/edit`                                                                                                                                                                                        | `OrganizerRoute`                              |
| User           | `/users/profile`, `/users/password`, `/notifications`, `/forum`                                                                                                                                                               | `PrivateRoute`                                |
| User           | `/users/:paramId/show`                                                                                                                                                                                                        | `OrganizerRoute`                              |
| Page mgmt      | `/administration/page-groups`, `/administration/page-groups/:paramId`, `/administration/page-groups/:paramId/pages`, `/administration/pages/:paramId`, `/administration/notifications`                                        | `OrganizerRoute`                              |
| Administration | `/administration/main`, `audit`, `blocked-dates`, `comments`, `portal-configuration`, `download`, `files`, `payments`, `statistics`, `tags`, `tag-groups`, `tokens`, `certificate-classifications`, `users`, `users/:paramId` | `AdminRoute`                                  |
| Administration | `/administration/members`, `/administration/members/:paramId/edit`                                                                                                                                                            | `AdminRoute` + `membership-type !== DISABLED` |
| Administration | `/administration/comment-moderation`                                                                                                                                                                                          | `AdminRoute` + `commenting-enabled`           |
| Fallback       | `*` → redirect to `/`                                                                                                                                                                                                         | —                                             |

Note that page-group management and notifications are **organizer**-accessible even though they sit under
`/administration/`.

## 3. Architecture and data flow

- Session/config boot happens in `src/session/SessionProvider.tsx`. On startup it always loads frontend configuration (`/configurations/frontend`), then loads
  portal configuration only when a user session exists in `localStorage`.
- Frontend configuration drives global UI defaults and form limits (organization name, default/enabled languages, timezone, max depth, participant counts).
  Portal configuration drives feature flags and admin-editable runtime behaviour.
- `src/components/main/NavigationBar.tsx` is a good example of cross-feature composition: it combines `useSession()`, page navigation from
  `pageAPI.getNavigationItems(language)`, blog menu items, roles, and portal-config feature flags.
- CMS-style content comes from backend-managed pages: `src/components/Page/Page.tsx` renders sanitized HTML from the API with `DOMPurify`;
  `src/components/main/Home.tsx` is just `Page pageId={1}`. Page bodies are edited with a custom CKEditor 5 build (`PageBodyEditor`, `CKUploadAdapter`).
- Navigation is refreshed via a custom browser event. `src/components/Page/Pages.tsx` dispatches
  `reloadNavigationEvent`; `NavigationBar.tsx` listens for it to rebuild page-group menu items.

### Session and auth

- `RoleEnum` (`src/models/RoleEnum.ts`) is an object-as-const, not a TypeScript `enum`: `ROLE_ADMIN`, `ROLE_ORGANIZER`,
  `ROLE_USER`, `ROLE_ANONYMOUS`. Most enums in `src/models` follow this same object-as-const pattern.
- Authentication is **cookie-based**: axios is configured with `withCredentials: true` and no `Authorization` header is set. `UserSessionToken` in
  `localStorage` carries roles and `expiresAt` for client-side gating only.
- `localStorage` holds `user` (the full `UserSessionToken`) and `language`. `src/session/AuthVerify.tsx` logs out expired sessions by checking `expiresAt` on
  every route change.
- Route guards are thin wrappers in `src/session/{PrivateRoute,OrganizerRoute,AdminRoute}.tsx`; add access control there instead of duplicating role checks in
  pages. `PrivateRoute` requires any session, `OrganizerRoute` requires
  `ROLE_ORGANIZER` or `ROLE_ADMIN`, `AdminRoute` requires `ROLE_ADMIN`. Unauthenticated users go to `/login`, authenticated-but-unprivileged users go to `/`.
- Login and registration are protected by Google reCAPTCHA v3 (`LoginWithCaptcha`).
- Client-side guards are convenience only; the backend re-checks every request. Never treat a UI role check as security.
- `src/services/sessionExpiryInterceptor.ts` is registered on every axios instance by `configureAxiosBaseUrl.ts`. It clears the stored session and redirects to
  `/login` on a 401, and on a 403 only when the stored session has already expired — a 403 is also the normal "you lack this permission" answer and must not
  sign a user out mid-session.

## 4. Security requirements (OWASP Top 10:2025)

`../OWASP-2025-Top10.md` is the full audit playbook and `../oxalate-backend/security/OWASP-2025-audit-report.md`
records the last audit. The rules below must stay true.

- **The backend is the authorization boundary.** Route guards, hidden buttons and disabled fields are UX. Roles live in `localStorage`, where the user can edit
  them, so a UI-only check protects nothing. If hiding a control is the only thing standing between a member and an action, the corresponding endpoint is
  missing a `@PreAuthorize`.
- **Never render untrusted HTML unsanitised.** Every `dangerouslySetInnerHTML` must wrap its value in
  `DOMPurify.sanitize(...)`. This applies to CKEditor content (`BlogCard.tsx`, `Page.tsx`) and to the deployment-supplied footer (`OxalateFooter.tsx`), which
  comes from a mounted `runtime-config.js`. Prefer plain text rendering; reach for `dangerouslySetInnerHTML` only when rich text is genuinely required.
- **Never put a backend message straight on screen.** Show a translated message and log the detail to the console. Backend error text can carry implementation
  detail, and it is not translated.
- **Never log a token, a password, or personal data**, and never `console.log`/`console.error` a whole response or request object — they contain both.
- **Never store a secret in the frontend.** `VITE_APP_*` values and `runtime-config.js` are shipped to the browser; only the reCAPTCHA *site* key belongs there,
  never a secret key.
- **`target="_blank"` requires `rel="noopener noreferrer"`.**
- **Keep the Content-Security-Policy working.** `vite.config.ts` injects it into production builds only. Adding a third-party script, iframe, font or API host
  means updating the policy; if a change needs `unsafe-eval` or a new wildcard source, find another way. The dev server is intentionally exempt so HMR keeps
  working. A response-header CSP in the serving layer takes precedence and should carry `frame-ancestors` as well.
- **Keep `ErrorBoundary` around the application tree** (`src/index.tsx`). Without it a single render failure yields a blank page. The fallback must never
  display the raw error.
- **Validate uploads on the client for UX, on the backend for safety.** `tools/FileUploadValidation` is a convenience, not a control.

New security behaviour needs a test in `src/__tests__/` named `security.*.test.ts(x)`; see
`security.OxalateFooter.test.tsx`, `security.sessionExpiryInterceptor.test.ts` and `security.ErrorBoundary.test.tsx`.

## 5. Configuration model (three layers, do not confuse them)

1. **Deployment/runtime branding** — `src/runtimeConfig.ts` merges build-time `VITE_APP_*` defaults with
   `window.__OXALATE_RUNTIME_CONFIG__` supplied by a mounted `runtime-config.js`. Controls `apiUrl`, `recaptchaSiteKey`,
   `pageTitle`, `copyrightFooter`, `poweredByOxalate`, and branding asset URLs under `/site-files/`. This is how one Docker image serves many organizations —
   see `CUSTOMIZATION.md`.
2. **Frontend configuration** — public, unauthenticated, read with `getFrontendConfigurationValue(key)`. Keys in use:
   `org-name`, `default-language`, `enabled-language`, `timezone`, `min-event-length`, `max-event-length`,
   `max-dive-length`, `min-participants`, `max-participants`, `max-depth`, `types-of-event`, `max-certificates`.
3. **Portal configuration** — authenticated, read with `getPortalConfigurationValue(group, key)` where group is a
   `PortalConfigGroupEnum` value (`commenting`, `email`, `general`, `frontend`, `files`, `membership`, `payment`). Notable keys: `general.blog-enabled`,
   `general.timezone`, `general.top-divers-list-size`,
   `commenting.commenting-enabled`, `commenting.commenting-enabled-features`, `membership.membership-type`
   (`DISABLED`/`PERPETUAL`/`PERIODICAL`/`DURATIONAL`), `membership.event-require-membership`,
   `payment.event-require-payment`, `payment.single-payment-enabled`, `files.dive-files-supported`,
   `files.documents-supported`.

`getPortalConfigurationValue` falls back to `defaultValue`, returns the first CSV token for `enum`-typed values with no runtime value, and returns `""` for
unknown keys. `Administration/PortalConfigurations.tsx` groups every
`PortalConfigurationResponse` by `groupKey` and edits it, so a new backend key shows up automatically — but it needs label and tooltip translation keys to be
readable.

## 6. Service layer conventions

- Most APIs extend `src/services/AbstractAPI.ts` (generic `findAll` / `findPageable` / `findById` / `create` / `update` /
  `delete`) and expose a singleton instance from the same file, e.g. `pageMgmtAPI`, `pageGroupMgmtAPI`, `diveEventAPI`,
  `membershipAPI`, `certificateAPI`, `tagsAPI`, `tokenAPI`, `auditAPI`, `statsAPI`.
- Base URLs come from `src/services/getApiBaseUrl.ts`, resolved in order `globalThis.__OXALATE_API_URL__` →
  `__OXALATE_VITE_APP_API_URL__` → `process.env.VITE_APP_API_URL`. `configureAxiosBaseUrl.ts` re-resolves the base URL on every request so reverse-proxy
  deployments work.
- Not every API uses `AbstractAPI`: `AuthAPI`, `PortalConfigurationAPI`, `FileTransferAPI`, `DownloadAPI`, and
  `EmailNotificationSubscriptionAPI` are bespoke because they have non-CRUD endpoints.
- Services `throw` on failure; callers catch and surface an `ActionResultEnum` or an Ant Design message.
- Keep model types in `src/models`, usually split into `props/`, `requests/`, and `responses/`, then re-exported through
  `src/models/index.ts`.
- Always import the directory, not the individual file, to get the barrel exports. This keeps imports clean and makes it easier to refactor file organization
  without breaking imports.
- Test files must use the nearest available barrel import for components, services, models, session utilities, and tools; extend the barrel when a tested export
  is not yet exposed.

## 7. UI and state patterns to preserve

- Components heavily use Ant Design primitives plus `message.useMessage()` for transient feedback; see
  `src/components/Administration/PortalConfigurations.tsx`.
- Charts use `@ant-design/charts`; CSV exports use `react-csv`; search highlighting uses `react-highlight-words`.
- Translation keys are literal strings passed to `t(...)`; keep additions aligned across
  `public/locales/{de,en,es,fi,sv}.json`.
- Day/time handling uses `dayjs` with `utc`, `timezone`, and `customParseFormat` plugins. They are initialized in both
  `src/App.tsx` and `src/tools/index.ts`, and mirrored in `src/setupTests.ts`.
- Custom hooks: `useSession()` (session/config context accessor) and `useBlogMenuItems()` (dynamic blog navigation).

## 8. DateTime/Date handling standards

**All datetime and date handling must be based on Dayjs. This is enforced at the API layer.**

- **DTOs (Requests & Responses)**: All date/datetime fields in request and response models must use `Dayjs` type, never
  `Date` or `string` (except for non-temporal string fields).
- **Timezone Strategy**: All datetimes/dates are stored and displayed in the dive site timezone, defined by the
  `general.timezone` portal configuration value (e.g., `Europe/Helsinki`).
    - When an operator creates a dive event starting on 31.05.2026 at 10:00, it means 10:00 in the portal's configured timezone.
- **API Deserialization**: When receiving API responses, the `AbstractAPI` class automatically converts date strings and Date objects to timezone-aware Dayjs
  instances. Date-only values are anchored at UTC midnight so the calendar date is preserved.
- **API Serialization**: When sending requests, Dayjs objects are automatically serialized to ISO-8601 strings before transmission.
- **Date Field Recognition**: `DATE_FIELD_PATTERNS` in `src/services/dateTransformer.ts` matches field names **exactly**:
  `createdAt`, `updatedAt`, `modifiedAt`, `deletedAt`, `startTime`, `endTime`, `startDate`, `endDate`, `blockedDate`,
  `certificationDate`, `eventDateTime`, `joinedAt`, `lastSeen`, `created`, `modified`.
- **Immutability**: Date transformations preserve object immutability; responses are never mutated in place.
- **Testing**: Tests verify immutability and timezone correctness of date transformations (see
  `src/__tests__/services.dateTransformer.test.ts`).
- **Global Timezone Context**: The timezone is set globally in `src/services/timezoneContext.ts` (default `UTC`) during app initialization in `SessionProvider`,
  and read by `AbstractAPI` for every response transformation.

**Adding new date/datetime fields:**

1. Use `Dayjs` type in model interfaces (both requests and responses)
2. If the field name doesn't match an existing entry, add it to `DATE_FIELD_PATTERNS` in `src/services/dateTransformer.ts`
3. The API layer will automatically handle conversion; no manual transformation needed in components

## 9. Internationalization

- Five locales, all kept at full parity: `public/locales/{de,en,es,fi,sv}.json` (~1190 keys each).
- `src/i18n.ts` uses `i18next-http-backend` (`/locales/{{lng}}.json`) with `fallbackLng: 'fi'`, plus the
  `translation-check` plugin that provides the `?showtranslations` UI (e.g. <http://localhost:3000/?showtranslations>).
- `node tools/verifyTranslationParity.cjs` compares all five files for missing keys and type mismatches; it exits `0`
  when they match and `1` otherwise. It is not wired into a package script — run it manually after touching locales.

## 10. Build, test, and debugging workflows

- The package manager is Yarn 4, pinned by the `packageManager` field in `package.json` (currently `yarn@4.18.0`). Enable Corepack and let it honour the pin
  rather than hardcoding a version:
    - `corepack enable`
    - `yarn install`
- Scripts: `start` (`env-cmd -f .env.local vite`), `build:test`, `build:stage`, `build:production`, `prebuild`, `test`,
  `test:watch`, `test:coverage`, `test:debug`, `lint`, `lint:fix`, `preview`.
- `yarn start` expects `.env.local` with at least `VITE_APP_API_URL` and the reCAPTCHA site key; variables are documented in
  `documentation/installation/index.md`. `vite.config.ts` injects them as `__OXALATE_VITE_APP_*__` compile-time constants rather than via `import.meta.env`.
- All builds run `generateBuildInfo.cjs` first. It reads `VERSION`, derives a tag-based version (optionally `git fetch`
  and `git describe`), and rewrites `src/buildInfo.json` with `buildTime` and `version`.
- Jest is configured in `jest.config.cjs` for `src/__tests__/**/*.test.ts(x)` with `ts-jest` (via `tsconfig.jest.json`)
  and `jest-environment-jsdom`; setup is `jest.setup.ts` plus `src/setupTests.ts`. CSS/assets, CKEditor, reCAPTCHA,
  `LoginWithCaptcha`, and `OxalateFooter` are mocked through `moduleNameMapper`. There is no coverage threshold. (`jest.setup.js` is a legacy leftover that the
  config does not reference.)
- There are ~76 test files covering services, components, routing (`session.Routes`), `App.behavior`,
  `session.SessionProvider.behavior`, `i18n.configuration`, and `tools.*`. Service tests use `axios-mock-adapter`
  (see `src/__tests__/services.AbstractAPI.test.ts`).
- There is **no** `typecheck` script and CI does not type-check (`vite build` transpiles without type checking). You can run
  `yarn tsc -p tsconfig.app.json --noEmit` manually, but be aware it currently reports a **pre-existing baseline of errors** (mostly `Dayjs` vs `string`/`Date`
  mismatches in Administration/Payment/User components, `AbstractAPI`, and
  `dateTransformer`). Compare against that baseline instead of expecting zero, and do not add new errors.
  `tsconfig.app.json` is the strict app config, `tsconfig.node.json` covers build tooling, and `tsconfig.jest.json` is the looser test transform config.
- CI (`.github/workflows/ci.yaml`) runs on Node 24: `yarn install --immutable`, `yarn build:test`, `yarn test`,
  `yarn test:coverage`, `yarn lint`. Match this locally before opening a PR.
- ESLint uses the flat config in `eslint.config.js` (`typescript-eslint` + `react-hooks`), with
  `@typescript-eslint/no-deprecated` set to `warn` and `no-console` off. The CRA-style `eslintConfig` block still present in `package.json` is legacy and
  unused.

## 11. Deployment notes that affect code changes

- Vite builds into `dist/` (`vite.config.ts`).
- The root `Dockerfile` is a static nginx image serving port `8080` with SPA fallback (`try_files ... /index.html`). It copies an already-built `dist/` and
  default branding into `/usr/share/nginx/html/site-files/`; it does **not** run the Vite build itself and does **not** proxy `/api`.
- `runtime-config.js` is served with `no-store` so branding/API overrides take effect without a rebuild. The checked-in
  `public/runtime-config.js` intentionally contains an empty override object.

## 12. Starting points for common agent tasks

**Add a screen or route**

1. Create the component under the right `src/components/<Area>/` folder and export it from that folder's barrel and
   `src/components/index.ts`.
2. Register the route in `src/App.tsx` with the correct guard, and add the navigation entry in `NavigationBar.tsx` with a matching `checkRoles` call.
3. If the feature is optional for an organization, gate both the route and the menu entry on a portal configuration flag.
4. Add all visible strings to the five locale files and run the parity checker.
5. Add a test; `session.Routes` and `App.behavior` tests are the pattern for guard/flag behaviour.

**Consume a new backend endpoint**

1. Add the request/response interfaces under `src/models/requests` / `src/models/responses` and export them from the barrels. Use `Dayjs` for temporal fields.
2. Extend the matching service in `src/services/`; prefer `AbstractAPI` unless the endpoint is non-CRUD.
3. If a temporal field has a new name, add it to `DATE_FIELD_PATTERNS`.
4. Add a service test using `axios-mock-adapter`, following the existing service test files.

**Add a configuration-driven behaviour**

Decide first whether it belongs in the public frontend configuration (`getFrontendConfigurationValue`) or the authenticated portal configuration
(`getPortalConfigurationValue`) before wiring UI logic. Purely deployment/branding concerns belong in `runtime-config.js` instead. The backend must define and
seed the key.

**Change CMS/blog/page-group behaviour**

Verify both the editing screen and the menu regeneration path (`reloadNavigationEvent`), and check the anonymous-read and organizer-write permission cases.

**Definition of done**

- `yarn test` and `yarn lint` pass (`yarn lint` is currently clean, so any ESLint output is a regression you introduced).
- `yarn tsc -p tsconfig.app.json --noEmit` introduces no *new* errors beyond the existing baseline.
- The section 4 security rules still hold: no unsanitised `dangerouslySetInnerHTML`, no raw backend message rendered, no token/PII logged, no secret in a
  `VITE_APP_*` value, `rel="noopener noreferrer"` on every `target="_blank"`, and the CSP in `vite.config.ts` covers any newly added external origin.
- New security behaviour has a `security.*` test in `src/__tests__/`.
- New or changed API methods have service tests; regressions found during the change get a test that pins the fix.
- Any added or changed visible text exists in all five locale files and `node tools/verifyTranslationParity.cjs` exits 0.
- Role/flag gating is applied in both the route guard and the navigation entry.
- New barrel exports are added rather than deep imports.
- In case of deprecations, never ignore nor remove old code without a clear migration path. Instead, plan for cleanup and include it in the task description so
  that the migration from the deprecated code to the new code becomes a part of the expanded task.
