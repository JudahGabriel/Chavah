# Chavah UI Migration: AngularJS → Lit + Web Awesome (pwa-starter)

**Date:** 2026-09-01
**Status:** Approved design
**Author:** Migration effort (Copilot)

## Overview

Chavah Messianic Radio's frontend is an AngularJS 1.7 SPA served by ASP.NET Core
(`Chavah`). This effort replaces the AngularJS frontend, in place, with a
modern web-components UI based on the [pwa-starter](https://github.com/pwa-builder/pwa-starter)
stack:

- **Lit** web components
- **Web Awesome** component library (`@awesome.me/webawesome`), built atop Lit
- **Vite** build tooling

The backend (ASP.NET Core MVC + Web API + RavenDB) is **not** rewritten. Only the
frontend is migrated. The one additive backend change is a SPA fallback route to
support path-based client routing (see "Routing").

The existing UI and functionality are preserved as closely as possible. Visual
parity is validated against production (https://messianicradio.com) using the
spiderloop skill.

## Goals

- Replace AngularJS/jQuery/Bootstrap 3 frontend with Lit + Web Awesome.
- Preserve existing look-and-feel and all existing functionality.
- Use Web Awesome components (`<wa-button>`, `<wa-dropdown>`, `<wa-dialog>`, etc.)
  in place of native/Bootstrap elements where it makes sense.
- Keep the frontend served by ASP.NET Core out of `wwwroot`, built by Vite.
- Consume the existing JSON API controllers unchanged.

## Non-Goals

- No changes to API controllers, services, models, or RavenDB on the backend
  (other than the additive SPA fallback route + dev proxy wiring).
- No feature additions or redesigns. This is a like-for-like migration.
- Native app shells (iOS/Cordova) are out of scope for this effort.

## Key Decisions

| Decision | Choice |
| --- | --- |
| Frontend location | In place inside `Chavah/client`, building to `Chavah/wwwroot` |
| Reference pattern | `C:\dev\store.web\src\Api\client` (Vite + Lit + Web Awesome served by ASP.NET) |
| Routing | Path-based (`/trending`) via the web platform **Navigation API**, with server SPA fallback; legacy `#/x` links redirected client-side to `/x` |
| Theming | Web Awesome theme + design tokens; brand color aligned to Chavah `#2f3d58` |
| Dates/formatting | Web platform **Intl** APIs (no moment.js) |
| Dev workflow | Vite dev server (HMR) proxied by ASP.NET Core in Development |
| Component library | Web Awesome; component APIs read from `node_modules/@awesome.me/webawesome/dist/llms.txt` |
| Sequencing | Phased — scaffold + core listening experience first, then remaining pages in batches |
| Validation | `vite build` + `dotnet build` + spiderloop visual comparison vs production |

## Architecture

```
Chavah/
  client/                     ← NEW Vite + Lit + Web Awesome app
    index.html
    vite.config.ts            ← outDir → ../wwwroot; VitePWA; dev server HMR
    package.json
    tsconfig.json
    src/
      app-root.ts             ← <chavah-app> shell: header + <router outlet> + footer
      pages/                  ← one Lit component per route
      components/             ← reusable UI (header, footer, song-deck, song-list, modals)
      services/               ← ported from wwwroot/js/Services
      models/                 ← ported from wwwroot/js/Models
      shared/                 ← styles, router, constants, app-color theming
  wwwroot/                    ← Vite build output (assets/js/*), replaces old js/ + lib/
  Views/Home/Index.cshtml     ← hosts <chavah-app>, still injects HomeViewModel + social cards
  Views/Shared/_Layout.cshtml ← drops AngularJS/jQuery/Bootstrap; loads Vite bundle
```

- `vite build` outputs to `../wwwroot` with `assetsDir: assets/js` (mirrors the
  store.web reference). Old `wwwroot/js`, `wwwroot/lib`, `wwwroot/views`, and
  `wwwroot/css/app` are removed as pages are migrated; static assets
  (`images/`, `favicon.ico`, `manifest.json`, `robots.txt`) are kept.
- `_Layout.cshtml` removes all AngularJS, jQuery, Bootstrap, moment, lodash, rxjs,
  nprogress `<script>`/`<link>` tags and instead loads the Vite-built entry.
- The server keeps rendering `Index` with `HomeViewModel`, exposed to the client
  as `window["BitShuva.Chavah.HomeViewModel"]` exactly as today, and keeps the
  Twitter/OpenGraph social-card `<meta>` tags for `?song=` / `?artist=` / `?album=`.
- Google Analytics and service worker registration remain in `_Layout`; the SW
  itself is produced by VitePWA (Workbox) replacing the hand-written SW.

## Routing

- Client uses **path-based** routing built on the web platform **Navigation API**
  (`navigation.addEventListener("navigate", …)` with `intercept()`), not a hash
  router or third-party router. A small `urlpattern-polyfill` may back route
  matching. Route table replicates `App.ts`, including:
  - Access levels: Anonymous / Authenticated / Admin, with redirect-to-sign-in
    guards and admin-script loading behavior.
  - All redirects (`/nowplaying → /`, `/admin/songs → /admin`, maintenance mode).
- **Backend (additive):** add a SPA fallback so non-API, non-file GET requests
  render `Index` (`MapFallbackToController`/`MapFallbackToFile` equivalent that
  preserves the existing `HomeController.Index` model injection). API routes
  (`/api/*`, controller routes) and `.well-known`, `serviceworker`, `sitemap`,
  `appstore`, etc. are unaffected.
- **Legacy link compatibility:** on startup the client detects a `#/...` hash and
  rewrites it to the equivalent path (`#/trending` → `/trending`) so old shared
  links and bookmarks continue to work.
- Social-card URLs (`/?song=songs/32`) continue to be handled server-side by
  `HomeController.Index`; the client reads the injected song from `HomeViewModel`.

## Component & Service Patterns

**Pages** (`src/pages`): one Lit element per route (e.g. `now-playing-page`,
`trending-page`, `sign-in-page`), lazy-loaded by the router.

**Components** (`src/components`): reusable UI — `chavah-header`, `chavah-footer`,
`song-deck`, `song-list`, `artist-list`, and modal dialogs.

**Web Awesome usage** (replacing Bootstrap/native):

| Existing | Web Awesome |
| --- | --- |
| `<button>`, `<a class="btn">` | `<wa-button>` |
| `uib-dropdown` / `.dropdown-menu` (header, share menu) | `<wa-dropdown>` |
| `uib-modal` (`$uibModal`) dialogs | `<wa-dialog>` |
| `uib-tooltip` | `<wa-tooltip>` |
| `<input type="range">` (volume) | `<wa-slider>` |
| Font Awesome `<i class="fa">` | `<wa-icon>` (Font Awesome family) |
| `.alert` (donation banner) | `<wa-callout>` |
| `uib-accordion`/panel (rank expander) | `<wa-details>` |

**Services** (`src/services`): ported from the existing TypeScript in
`wwwroot/js/Services`. They are largely framework-agnostic; AngularJS
dependencies are replaced:

- `$http` / `HttpApiService` → `fetch`-based API service (same method surface).
- `$q` → native `Promise`.
- `angular-local-storage` → `localStorage` wrapper.
- moment.js → `Intl` APIs.
- `$rootScope` events / two-way binding → a small reactive store + Lit reactive
  properties / events. `AudioPlayerService` drives an `<audio>` element and emits
  status events consumed by header/footer/now-playing.

Method signatures and behavior are kept identical so the port is mechanical and
low-risk.

**Dynamic album-color theming:** each song exposes `albumColors`
(background / foreground / muted / textShadow / albumSwatchDarker). These are
applied via CSS custom properties on the relevant component subtree, preserving
the current per-song color-adaptive UI (extracted from album art).

**Dates & number formatting:** use the web platform `Intl` APIs
(`Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.NumberFormat`) in place
of moment.js. A small `dates.ts` helper wraps the common formatting used today.

## Theming

Adopt a Web Awesome theme and drive colors/spacing/typography through Web Awesome
**design tokens** (CSS custom properties). Set the brand/primary color to Chavah's
`#2f3d58` (the existing `theme-color`) and map the app's accent colors onto WA
token variables so buttons, dropdowns, dialogs, tooltips, sliders, etc. inherit a
consistent Chavah look. Typography keeps the current fonts (Lato, EB Garamond,
Cardo). Small visual deviations from the legacy Bootstrap look are acceptable so
long as brand color and overall layout stay aligned; spiderloop validates the
result against production.

## Phased Plan

- **Phase 1 (this deliverable):** Scaffold + core listening experience.
- **Phase 2+:** Remaining pages in batches — auth (register/password/reset),
  playlists (trending/popular/recent/mylikes), profile, donate flow, legal/info,
  music submission, then the admin suite (edit songs/albums/artists, tags, logs,
  users, donations, song-edit approvals, iOS logs).

### Phase 1 Detailed Scope

1. **Scaffold**: `client/` with Vite + Lit + Web Awesome + VitePWA; `vite.config.ts`
   building to `../wwwroot`; `package.json`/`tsconfig`; dev-server HMR config.
2. **Backend wiring**: dev proxy to Vite in Development; SPA fallback route;
   `_Layout.cshtml` and `Index.cshtml` updated to host `<chavah-app>` and load the
   Vite bundle; keep `HomeViewModel` injection + social-card meta.
3. **App shell + router**: `app-root.ts` (`<chavah-app>`), path-based router with
   access guards, legacy-hash redirect.
4. **Core services**: account/auth state, HTTP API service, `AudioPlayerService`,
   song API, likes API, song-request, sharing — ported and wired.
5. **Components**: `chavah-header` (title, notifications, profile/nav dropdown,
   donation banner), `chavah-footer` (thumb up/down, request, play/pause, skip,
   volume, track time, buffering, Discord), `song-deck`, `song-list`.
6. **Pages**: `now-playing-page` (left-pane lists + center deck + rank + tags) and
   the **sign-in** flow (`sign-in`, `password`, prompt-sign-in as needed for the
   core loop).
7. **Validation**: build passes; run app; spiderloop visual match vs production for
   header, footer, now-playing, and sign-in.

## Validation & Testing

- `npm run build` (tsc + vite build) succeeds with no type errors.
- `dotnet build Chavah` succeeds.
- App runs locally; audio plays; thumb/skip/request/volume work.
- spiderloop compares each migrated screen to production and iterates to visual
  alignment (layout, spacing, fonts Lato/EB Garamond/Cardo, colors, responsive
  breakpoints).

## Risks & Mitigations

- **Album-color theming fidelity** — preserve exact color math from the existing
  color-extraction code; apply via CSS variables. Mitigate with spiderloop diffs.
- **AudioPlayerService platform quirks** (iOS media session, buffering states) —
  port behavior verbatim; validate playback manually.
- **"No backend rewrite" constraint vs SPA fallback** — the fallback is a small,
  additive routing config change; no controllers/services/business logic change.
- **Scope size (40+ views)** — phased delivery; Phase 1 establishes the repeatable
  pattern (page + component + service + WA mapping + spiderloop) that later
  batches follow.
