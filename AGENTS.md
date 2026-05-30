# AGENTS.md

## Quick orientation

- This repo is a Vite + React 19 + TypeScript frontend for Oxalate Portal. App bootstrap is `src/index.tsx`: `I18nextProvider` → `SessionProvider` →
  `BrowserRouter` → `App`.
- `src/App.tsx` is the routing hub. Route availability is not static: it depends on `useSession()` state plus portal configuration values such as
  `membership-type`, `commenting-enabled`, and `blog-enabled`.
- Major feature areas are grouped under `src/components/Administration`, `DiveEvent`, `Page`, `Payment`, `User`, `Notification`, `Register`, `Statistics`, and
  `Blogging`, then re-exported through `src/components/index.ts`.

## Architecture and data flow

- Session/config boot happens in `src/session/SessionProvider.tsx`. On startup it always loads frontend configuration (`/configurations/frontend`), then loads
  portal configuration only when a user session exists in `localStorage`.
- Frontend configuration drives global UI defaults like organization name, default language, enabled languages, and timezone. Portal configuration drives
  feature flags and admin-editable runtime behavior.
- `src/components/main/NavigationBar.tsx` is a good example of cross-feature composition: it combines `useSession()`, page navigation from
  `pageAPI.getNavigationItems(language)`, blog menu items, roles, and portal-config feature flags.
- CMS-style content comes from backend-managed pages: `src/components/Page/Page.tsx` renders sanitized HTML from the API with `DOMPurify`;
  `src/components/main/Home.tsx` is just `Page pageId={1}`.
- Navigation is refreshed via a custom browser event. `src/components/Page/Pages.tsx` dispatches `reloadNavigationEvent`; `NavigationBar.tsx` listens for it to
  rebuild page-group menu items.

## Service layer conventions

- Most APIs extend `src/services/AbstractAPI.ts` and expose a singleton instance from the same file, e.g. `pageMgmtAPI`, `pageGroupMgmtAPI`, `diveEventAPI`.
- Base URLs come from `src/services/getApiBaseUrl.ts`: prefer same-origin calls when no env/global override exists. This supports reverse-proxy deployments.
- Not every API uses `AbstractAPI`: `src/services/AuthAPI.ts` and `PortalConfigurationAPI.ts` are custom because they have bespoke endpoints and login/config
  flows.
- Keep model types in `src/models`, usually split into `props/`, `requests/`, and `responses/`, then re-exported through `src/models/index.ts`.
- Always import the directory, not the individual file, to get the barrel exports. This keeps imports clean and makes it easier to refactor file organization
  without breaking imports.

## UI and state patterns to preserve

- Components heavily use Ant Design primitives plus `message.useMessage()` for transient feedback; see `src/components/Administration/PortalConfigurations.tsx`.
- Translation keys are literal strings passed to `t(...)`; keep additions aligned across `public/locales/{de,en,es,fi,sv}.json`.
- Day/time handling uses `dayjs` with `utc`, `timezone`, and `customParseFormat` plugins. They are initialized in both `src/App.tsx` and `src/tools/index.ts`,
  and mirrored in `src/setupTests.ts`.
- Session state is persisted in `localStorage` under `user` and `language`. `src/session/AuthVerify.tsx` logs out expired sessions by checking `expiresAt` on
  route changes.
- Route guards are thin wrappers in `src/session/{PrivateRoute,OrganizerRoute,AdminRoute}.tsx`; add access control there instead of duplicating role checks in
  pages.

## Build, test, and debugging workflows

- Use Yarn 4 via Corepack (`packageManager: yarn@4.13.0`). Standard loop:
    - `corepack enable`
    - `corepack prepare yarn@4.13.0 --activate`
    - `yarn install`
    - `yarn start`
    - `yarn test`
    - `yarn lint`
- `yarn start` runs `env-cmd -f .env.local vite`; local dev expects `.env.local` with at least `VITE_APP_API_URL` and reCAPTCHA site key variables documented in
  `documentation/installation/index.md`.
- Production/stage builds run `generateBuildInfo.cjs` first. That script does a `git fetch`, reads `VERSION`, derives a tag-based version, and rewrites
  `src/buildInfo.json`.
- Jest is configured for `src/__tests__/**/*.test.ts(x)` with `ts-jest` and `jest-environment-jsdom`. Existing tests emphasize service classes using
  `axios-mock-adapter` (see `src/__tests__/services.AbstractAPI.test.ts`).
- There is a translation parity checker not wired into package scripts: `node tools/verifyTranslationParity.cjs`.

## Deployment notes that affect code changes

- Vite builds into `build/` (`vite.config.ts`), not `dist/`.
- The root `Dockerfile` is a static nginx image that copies the already-built `build/` directory and serves it on port `8080`; it does not run the Vite build
  itself.
- The README documents a translation inspection UI at `http://localhost:3000/?showtranslations`.

## When making edits

- Prefer updating existing barrel exports (`src/components/index.ts`, `src/services/index.ts`, `src/models/index.ts`) when adding new feature modules.
- If you change CMS pages, blog navigation, or page-group administration, verify both the editing screen and menu regeneration path (`reloadNavigationEvent`).
- If you add config-driven behavior, decide whether it belongs in frontend config (`getFrontendConfigurationValue`) or authenticated portal config (
  `getPortalConfigurationValue`) before wiring UI logic.
- If any errors are reported as a result of your changes, do add test coverage to prevent regressions. If you add new API methods, add tests for them in the
  corresponding service test file.
- If any visible texts have been added or changed, update the translation files in `public/locales/{de,en,es,fi,sv}.json` and run the parity checker to verify
  consistency.
- Always verify the updates by running both the tests and linting and type checks: `yarn test`, `yarn lint`, `yarn tsc --noEmit`. If you add new tests,
  follow the existing patterns for service class testing with mocks.
- In case of deprecations, never ignore nor remove old code without a clear migration path. Instead, plan for cleanup and include it in the task description so
  that the migration from the deprecated code to the new code becomes a part of the expanded task.