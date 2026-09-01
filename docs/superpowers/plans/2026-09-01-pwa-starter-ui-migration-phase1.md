# Chavah PWA UI Migration — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Vite + Lit + Web Awesome frontend inside `Chavah.NetCore`, replacing the AngularJS shell, and migrate the core listening experience (header, footer, now‑playing, sign‑in) to visual parity with production.

**Architecture:** A new `Chavah.NetCore/client` Vite app builds Lit web components into `Chavah.NetCore/wwwroot`. ASP.NET Core keeps rendering `Views/Home/Index.cshtml` (with `HomeViewModel` + social‑card meta) but now hosts `<chavah-app>` and loads the Vite bundle. Client routing uses the web platform Navigation API with a server SPA fallback. Existing `/api/*` controllers are consumed unchanged.

**Tech Stack:** Lit 3, `@awesome.me/webawesome` 3.x, Vite 6, TypeScript 5, VitePWA/Workbox, Navigation API, Intl APIs. Backend: ASP.NET Core (net10.0), Razor, C#.

---

## Verification model (read first)

The existing frontend has **no test harness**, and adding one is out of scope (see spec Non‑Goals). Therefore "verify" steps in this plan use **build + type‑check + runtime + spiderloop visual checks** instead of unit tests:

- **Type/build gate:** `npm run build` (runs `tsc` then `vite build`) must succeed with zero errors.
- **Backend gate:** `dotnet build Chavah.NetCore/Chavah.NetCore.csproj` must succeed.
- **Runtime gate:** app runs; the specified screen renders; interactions work.
- **Visual gate:** use the `use-spiderloop` skill to compare the migrated screen against `https://messianicradio.com` and iterate to alignment.

Commit after every task.

---

## File structure (Phase 1)

```
Chavah.NetCore/
  client/
    .gitignore
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    src/
      main.ts                         ← entry: imports WA + theme, defines <chavah-app>, boots router
      app-root.ts                     ← <chavah-app> shell (header + <main id="outlet"> + footer)
      shared/
        theme.css                     ← Web Awesome theme token overrides (brand #2f3d58)
        global.css                    ← body gradient, fonts, scrollbar, layout helpers (portedから shared.less)
        home-view-model.ts            ← typed accessor over window["BitShuva.Chavah.HomeViewModel"]
        reactive-store.ts             ← tiny observable store base (replaces $rootScope events)
        router.ts                     ← Navigation API router + route table + access guards
        dates.ts                      ← Intl-based date/number helpers (replaces moment)
        constants.ts                  ← RouteAccess enum, app constants
      models/                         ← ported enums/interfaces (Song, User, AudioStatus, ...)
      services/                       ← ported services (http, account, songApi, likeApi, audioPlayer, ...)
      components/
        chavah-header.ts
        chavah-footer.ts
        song-deck.ts
        song-list.ts
      pages/
        now-playing-page.ts
        prompt-sign-in-page.ts
        sign-in-page.ts
        password-page.ts
  wwwroot/                            ← Vite build output: vite-index.html, assets/js/*
  Services/ViteAssets.cs              ← NEW: resolves dev/prod entry tags from vite-index.html
  Startup.cs                          ← MODIFIED: DI for ViteAssets, dev CORS, SPA fallback
  Views/Shared/_Layout.cshtml         ← MODIFIED: drop AngularJS/jQuery/Bootstrap; emit Vite tags
  Views/Home/Index.cshtml             ← MODIFIED: host <chavah-app>; keep HomeViewModel JSON
  Chavah.NetCore.csproj               ← MODIFIED: PreBuild runs client npm build
```

---

## Task 1: Scaffold the Vite client

**Files:**
- Create: `Chavah.NetCore/client/.gitignore`
- Create: `Chavah.NetCore/client/package.json`
- Create: `Chavah.NetCore/client/tsconfig.json`
- Create: `Chavah.NetCore/client/vite.config.ts`
- Create: `Chavah.NetCore/client/index.html`
- Create: `Chavah.NetCore/client/src/main.ts` (temporary stub, replaced in Task 2)

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
dist/
*.local
.vite/
stats.html
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "chavah-client",
  "version": "1.0.0",
  "description": "Chavah Messianic Radio frontend (Lit + Web Awesome)",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 5173 --strictPort",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@awesome.me/webawesome": "^3.10.0",
    "lit": "^3.2.1",
    "urlpattern-polyfill": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "typescript": "^5.6.0",
    "vite": "^6.0.15",
    "vite-plugin-pwa": "^1.0.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "types": ["node", "vite-plugin-pwa/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

> Note: `useDefineForClassFields: false` + `experimentalDecorators: true` is required for Lit's `@customElement`/`@property` decorators.

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig, PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const outDir = "../wwwroot";

export default defineConfig({
  base: "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    // HMR reaches the Vite dev server directly even when the app is viewed
    // through the ASP.NET origin or the spiderloop proxy.
    hmr: { host: "127.0.0.1", clientPort: 5173, protocol: "ws" },
    cors: true,
  },
  build: {
    outDir,
    emptyOutDir: false, // wwwroot also holds images/, favicon, manifest.json
    assetsDir: "assets/js",
    target: "ES2022",
    sourcemap: false,
    manifest: true,
    rollupOptions: {
      input: { index: fileURLToPath(new URL("index.html", import.meta.url)) },
    },
  },
  plugins: [
    VitePWA({
      base: "/",
      scope: "/",
      registerType: "autoUpdate",
      injectRegister: null, // registration stays in _Layout.cshtml
      manifest: false, // server already serves /manifest.json
      strategies: "generateSW",
      filename: "service-worker.js",
      workbox: {
        globDirectory: outDir,
        globPatterns: ["assets/js/*.js", "assets/js/*.css"],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }) as PluginOption,
    renameIndexHtmlPlugin(),
  ],
});

// Vite emits index.html into wwwroot; rename it to vite-index.html so it doesn't
// collide with Razor routing, and so ViteAssets.cs can parse the hashed tags.
function renameIndexHtmlPlugin(): PluginOption {
  return {
    name: "rename-index-html",
    apply: "build",
    closeBundle() {
      const from = path.resolve(__dirname, outDir, "index.html");
      const to = path.resolve(__dirname, outDir, "vite-index.html");
      if (fs.existsSync(from)) fs.renameSync(from, to);
    },
  };
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <base href="/" />
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create temporary `src/main.ts` stub**

```ts
document.body.textContent = "Chavah client scaffold OK";
```

- [ ] **Step 7: Install and build**

Run:
```bash
cd Chavah.NetCore/client && npm install && npm run build
```
Expected: `npm install` succeeds; `npm run build` succeeds; `Chavah.NetCore/wwwroot/vite-index.html` exists and references `/assets/js/index-*.js`.

- [ ] **Step 8: Commit**

```bash
git add Chavah.NetCore/client Chavah.NetCore/wwwroot/vite-index.html Chavah.NetCore/wwwroot/assets
git commit -m "feat(client): scaffold Vite + Lit + Web Awesome frontend"
```

---

## Task 2: App shell, theme tokens, and Web Awesome bootstrap

**Files:**
- Create: `Chavah.NetCore/client/src/shared/theme.css`
- Create: `Chavah.NetCore/client/src/shared/global.css`
- Create: `Chavah.NetCore/client/src/app-root.ts`
- Modify: `Chavah.NetCore/client/src/main.ts`

- [ ] **Step 1: Read Web Awesome component APIs**

Before writing components, read `Chavah.NetCore/client/node_modules/@awesome.me/webawesome/dist/llms.txt` for exact props/slots/events/CSS parts of `wa-button`, `wa-dropdown`, `wa-dialog`, `wa-tooltip`, `wa-slider`, `wa-icon`, `wa-callout`, `wa-details`, `wa-spinner`, `wa-input`. Confirm the correct theme stylesheet path and `setBasePath`/registration mechanism for 3.x. Adjust import paths in the following steps to match what the installed version actually exposes.

- [ ] **Step 2: Create `shared/theme.css` (brand tokens)**

Map Web Awesome tokens to Chavah's brand. Values come from `wwwroot/css/variables.less` (`@brand-color: rgb(47,61,88)` = `#2f3d58`; title gold `#e9dd9a`; darker gold `#d7c146`).

```css
:root,
:host {
  --wa-color-brand-fill-loud: #2f3d58;      /* primary buttons/controls */
  --wa-color-brand-fill-normal: #2f3d58;
  --wa-color-brand-border-loud: #263250;
  --wa-color-brand-on-loud: #ffffff;

  /* Chavah semantic tokens reused across components */
  --chavah-brand: #2f3d58;
  --chavah-brand-light: #3c4d6f;
  --chavah-brand-dark: #263250;
  --chavah-title: #e9dd9a;
  --chavah-title-darker: #d7c146;
  --chavah-text: #2f3d58;
  --chavah-hebrew-font: "Cardo", serif;
  --chavah-max-page: 1520px;
}
```

> The exact `--wa-color-*` token names must be reconciled against `llms.txt` in Step 1; adjust names if the installed WA version differs.

- [ ] **Step 3: Create `shared/global.css`**

Port the global rules from `wwwroot/css/app/shared.less` and the fonts/theme‑color usage. Keep the radial gold gradient background and custom scrollbar.

```css
@import url("https://fonts.googleapis.com/css?family=Lato:400,700,400italic|EB+Garamond|Cardo&display=swap");

html { min-height: 100%; overflow-x: hidden; }

body {
  margin: 0;
  font-family: "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--chavah-text);
  background: radial-gradient(closest-side at 50% 50%,
      rgba(255, 215, 0, 0.15), rgba(218, 165, 32, 0.1), rgba(47, 61, 88, 0.1));
  background-repeat: no-repeat;
  min-height: 100vh;
  scrollbar-width: thin;
  scrollbar-color: var(--chavah-brand) rgb(241, 240, 237);
}
::-webkit-scrollbar { width: 6px; background-color: rgb(241, 240, 237); }
::-webkit-scrollbar-thumb { background: var(--chavah-brand); }

.hebrew { font-family: var(--chavah-hebrew-font); direction: rtl; }
```

- [ ] **Step 4: Create `app-root.ts`**

```ts
import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/chavah-header";
import "./components/chavah-footer";

@customElement("chavah-app")
export class ChavahApp extends LitElement {
  // Light DOM so global.css + page components style normally and the router can
  // place page elements into the outlet without shadow-boundary friction.
  createRenderRoot() { return this; }

  @state() private outletReady = false;

  render() {
    return html`
      <chavah-header></chavah-header>
      <main id="currentPageContainer"></main>
      <chavah-footer></chavah-footer>
    `;
  }
}
```

> `#currentPageContainer` matches the legacy id so ported CSS (`padding: 100px 10px; max-width: 1520px; margin: auto`) applies. The router (Task 3) injects the active page element into this element.

- [ ] **Step 5: Replace `main.ts`**

```ts
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "./shared/theme.css";
import "./shared/global.css";
import "./app-root";
import { startRouter } from "./shared/router";

// Boot the SPA once DOM is ready.
startRouter();
```

> Reconcile the WA base CSS import path with `llms.txt` (Step 1). `startRouter` is created in Task 3; to build Task 2 in isolation, temporarily stub `shared/router.ts` with `export function startRouter() {}` and replace it in Task 3.

- [ ] **Step 6: Add `#currentPageContainer` layout to `global.css`**

```css
#currentPageContainer {
  display: block;
  padding: 100px 10px 100px 10px;
  max-width: var(--chavah-max-page);
  margin-inline: auto;
}
```

- [ ] **Step 7: Build**

Run: `cd Chavah.NetCore/client && npm run build`
Expected: success; `wwwroot/vite-index.html` present.

- [ ] **Step 8: Commit**

```bash
git add Chavah.NetCore/client Chavah.NetCore/wwwroot
git commit -m "feat(client): app shell, Web Awesome theme tokens, global styles"
```

---

## Task 3: Navigation API router with access guards

**Files:**
- Create: `Chavah.NetCore/client/src/shared/constants.ts`
- Create: `Chavah.NetCore/client/src/shared/router.ts`

- [ ] **Step 1: Create `constants.ts`**

```ts
export enum RouteAccess { Anonymous, Authenticated, Admin }

export interface AppRoute {
  pattern: string;                 // URLPattern pathname, e.g. "/trending"
  access: RouteAccess;
  load: () => Promise<unknown>;    // dynamic import of the page module
  tag: string;                     // custom element tag to instantiate
  redirectTo?: string;             // if set, navigate here instead of rendering
}
```

- [ ] **Step 2: Create `router.ts`**

Replicates `wwwroot/js/App.ts` route table using path‑based URLs (drop the `#`). Guards mirror `$routeChangeStart`: redirect to sign‑in when access requires auth/admin. Legacy `#/x` links are rewritten to `/x` on boot.

```ts
import "urlpattern-polyfill";
import { RouteAccess, AppRoute } from "./constants";
import { accountService } from "../services/account-service";
import { appNav } from "../services/app-nav-service";

const routes: AppRoute[] = [
  { pattern: "/", access: RouteAccess.Anonymous, tag: "now-playing-page", load: () => import("../pages/now-playing-page") },
  { pattern: "/nowplaying", access: RouteAccess.Anonymous, tag: "", load: async () => {}, redirectTo: "/" },
  { pattern: "/trending", access: RouteAccess.Anonymous, tag: "trending-page", load: () => import("../pages/trending-page") },
  { pattern: "/popular", access: RouteAccess.Anonymous, tag: "popular-page", load: () => import("../pages/popular-page") },
  { pattern: "/recent", access: RouteAccess.Anonymous, tag: "recent-page", load: () => import("../pages/recent-page") },
  { pattern: "/mylikes", access: RouteAccess.Authenticated, tag: "my-likes-page", load: () => import("../pages/my-likes-page") },
  { pattern: "/profile", access: RouteAccess.Authenticated, tag: "profile-page", load: () => import("../pages/profile-page") },
  { pattern: "/promptsignin", access: RouteAccess.Anonymous, tag: "prompt-sign-in-page", load: () => import("../pages/prompt-sign-in-page") },
  { pattern: "/signin", access: RouteAccess.Anonymous, tag: "sign-in-page", load: () => import("../pages/sign-in-page") },
  { pattern: "/password/:email", access: RouteAccess.Anonymous, tag: "password-page", load: () => import("../pages/password-page") },
  // ... remaining routes added in later phases (see App.ts). Unknown → redirect "/".
];

let outletEl: HTMLElement | null = null;

export function startRouter() {
  // Rewrite legacy hash deep links (#/trending → /trending) once on boot.
  if (location.hash.startsWith("#/")) {
    const path = location.hash.slice(1);
    history.replaceState({}, "", path + location.search);
  }

  if (!("navigation" in window)) {
    // Navigation API unsupported: fall back to click+popstate interception.
    installFallback();
  } else {
    (window as any).navigation.addEventListener("navigate", (e: any) => {
      if (!e.canIntercept || e.hashChange || e.downloadRequest !== null) return;
      const url = new URL(e.destination.url);
      if (url.origin !== location.origin) return;
      e.intercept({ handler: () => renderRoute(url.pathname) });
    });
  }

  renderRoute(location.pathname);
}

function matchRoute(pathname: string): { route: AppRoute; params: Record<string, string> } | null {
  for (const route of routes) {
    const p = new URLPattern({ pathname: route.pattern });
    const m = p.exec({ pathname });
    if (m) return { route, params: m.pathname.groups as Record<string, string> };
  }
  return null;
}

async function renderRoute(pathname: string) {
  const match = matchRoute(pathname) ?? { route: routes.find(r => r.pattern === "/")!, params: {} };
  const { route, params } = match;

  if (route.redirectTo) { navigateTo(route.redirectTo); return; }

  // Access guards (mirror App.ts $routeChangeStart).
  const needsSignIn = !accountService.isSignedIn && route.access !== RouteAccess.Anonymous;
  const needsAdmin = route.access === RouteAccess.Admin && !accountService.currentUser?.isAdmin;
  if (needsSignIn || needsAdmin) { appNav.signIn(); return; }

  await route.load();
  outletEl = outletEl ?? document.getElementById("currentPageContainer");
  if (!outletEl) return;
  const el = document.createElement(route.tag) as HTMLElement & { params?: Record<string, string> };
  el.params = params;
  outletEl.replaceChildren(el);
}

export function navigateTo(path: string) {
  if ("navigation" in window) (window as any).navigation.navigate(path);
  else { history.pushState({}, "", path); renderRoute(new URL(path, location.origin).pathname); }
}

function installFallback() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.origin !== location.origin) return;
    e.preventDefault();
    navigateTo(a.pathname + a.search);
  });
  window.addEventListener("popstate", () => renderRoute(location.pathname));
}
```

> `trending-page`, `popular-page`, etc. are stubbed in later phases. For Phase 1, keep only the routes whose page modules exist (`/`, `/nowplaying`, `/promptsignin`, `/signin`, `/password/:email`) and add the rest as their pages land. `accountService` and `appNav` come from Task 6.

- [ ] **Step 3: Build**

Run: `cd Chavah.NetCore/client && npm run build`
Expected: success (with Task 6 services present) — if implementing Task 3 before Task 6, temporarily stub `accountService`/`appNav`.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/shared
git commit -m "feat(client): Navigation API router with access guards + legacy hash redirect"
```

---

## Task 4: Backend wiring (ViteAssets, CORS, SPA fallback, Razor, csproj)

**Files:**
- Create: `Chavah.NetCore/Services/ViteAssets.cs`
- Modify: `Chavah.NetCore/Startup.cs` (DI ~line 113; pipeline ~line 189–215)
- Modify: `Chavah.NetCore/Views/Shared/_Layout.cshtml`
- Modify: `Chavah.NetCore/Views/Home/Index.cshtml`
- Modify: `Chavah.NetCore/Chavah.NetCore.csproj` (PreBuild target ~line 80)

- [ ] **Step 1: Create `Services/ViteAssets.cs`**

Resolves the entry tags. In Development, points at the Vite dev server (`http://127.0.0.1:5173`). In Production, parses `wwwroot/vite-index.html` (modeled on the store.web `ViteEntryPointProvider`).

```csharp
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace BitShuva.Chavah.Services
{
    public class ViteAssets
    {
        private const string DevOrigin = "http://127.0.0.1:5173";
        public bool IsDevelopment { get; }
        public string DevOrigin_ { get; } = DevOrigin;
        public string EntryJs { get; } = string.Empty;
        public string? EntryCss { get; }
        public IReadOnlyList<string> ModulePreloads { get; } = new List<string>();

        public ViteAssets(IWebHostEnvironment env)
        {
            IsDevelopment = env.IsDevelopment();
            if (IsDevelopment)
            {
                return; // Dev tags are emitted directly in _Layout.
            }

            var indexPath = Path.Combine(env.WebRootPath, "vite-index.html");
            if (!File.Exists(indexPath))
            {
                throw new FileNotFoundException($"vite-index.html not found at {indexPath}. Run the client build.");
            }

            var html = File.ReadAllText(indexPath);
            EntryJs = Regex.Match(html, "<script[^>]+src=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase).Groups[1].Value;
            var css = Regex.Match(html, "<link[^>]+rel=[\"']stylesheet[\"'][^>]+href=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase);
            EntryCss = css.Success ? css.Groups[1].Value : null;
            ModulePreloads = Regex.Matches(html, "<link[^>]+rel=[\"']modulepreload[\"'][^>]+href=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase)
                .Select(m => m.Groups[1].Value).ToList();
        }
    }
}
```

- [ ] **Step 2: Register `ViteAssets` in DI**

In `Startup.cs` `ConfigureServices`, right after `services.AddControllersWithViews(...)` (~line 113), add:

```csharp
services.AddSingleton<Services.ViteAssets>();

// Allow the Vite dev server origin during development (HMR + module loads).
if (Environment.IsDevelopment())
{
    services.AddCors(o => o.AddPolicy("ViteDev", p =>
        p.WithOrigins("http://127.0.0.1:5173", "http://localhost:5173")
         .AllowAnyHeader().AllowAnyMethod()));
}
```

> `Environment` is the `IWebHostEnvironment` captured in the `Startup` constructor. If `Startup` does not already hold it, add a `private readonly IWebHostEnvironment Environment;` field assigned in the constructor (it already receives configuration; confirm and add env if missing).

- [ ] **Step 3: Wire CORS + SPA fallback in the pipeline**

In `Startup.cs` `Configure`, after `app.UseRouting();` (~line 212) add the dev CORS use, and change the endpoints registration (~line 215) to add a SPA fallback to `Home/Index`:

```csharp
if (env.IsDevelopment())
{
    app.UseCors("ViteDev");
}
```

Replace:
```csharp
app.UseEndpoints(endpoints => endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}"));
```
with:
```csharp
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
    // SPA fallback: any unmatched non-file, non-/api GET renders the SPA shell.
    endpoints.MapFallbackToController("Index", "Home");
});
```

> `/api/*` controller routes and `.well-known`, `serviceworker`, `sitemap`, static files, etc. take precedence over the fallback, so only client routes (e.g. `/trending`) hit `Home/Index`.

- [ ] **Step 4: Update `_Layout.cshtml`**

Remove **all** AngularJS/jQuery/Bootstrap/moment/lodash/rxjs/nprogress/tinycolor/modernizr `<script>` tags (the two `<environment>` JS blocks) and the Bootstrap/bootswatch/font‑awesome/nprogress/app CSS `<link>` tags. Inject `ViteAssets` and emit Vite tags. Keep: manifest, favicons, theme‑color, viewport, Twitter/OG meta, the splash `<div>`, Google Analytics, and the service‑worker registration.

At the top of the file add:
```cshtml
@inject BitShuva.Chavah.Services.ViteAssets Vite
```

Replace the CSS `<environment>` blocks and the JS `<environment>` blocks with:
```cshtml
@* Fonts kept; component styles ship in the Vite bundle *@
<environment include="Development">
    <script type="module" src="@($"{Vite.DevOrigin_}/@@vite/client")"></script>
    <script type="module" src="@($"{Vite.DevOrigin_}/src/main.ts")"></script>
</environment>
<environment include="Test,Staging,Production">
    @if (Vite.EntryCss != null)
    {
        <link rel="stylesheet" href="@Vite.EntryCss" />
    }
    @foreach (var preload in Vite.ModulePreloads)
    {
        <link rel="modulepreload" crossorigin href="@preload" />
    }
    <script type="module" src="@Vite.EntryJs"></script>
</environment>
```

> `@@vite/client` — the double `@@` escapes Razor's `@`. The `<base href="/">`, splash div, GA snippet, and `navigator.serviceWorker.register('/serviceworker')` block remain unchanged.

- [ ] **Step 5: Update `Index.cshtml`**

Replace the AngularJS bootstrap markup with the `<chavah-app>` host, keeping the HomeViewModel JSON injection and the descriptive image.

```cshtml
@model BitShuva.Chavah.Models.HomeViewModel
@if (Model.DescriptiveImageUrl != null)
{
    <img src="@Model.DescriptiveImageUrl" style="display:none;" />
}

<chavah-app></chavah-app>

<script type="text/javascript">
    window["BitShuva.Chavah.HomeViewModel"] = @Html.Raw(Model.ToJson());
</script>
```

- [ ] **Step 6: Update the csproj PreBuild target**

Replace the existing `PreBuild` target (~line 80) so a production `dotnet build`/publish also builds the client:

```xml
<Target Name="BuildClient" BeforeTargets="BeforeBuild" Condition="'$(Configuration)' == 'Release'">
  <Exec Command="npm install" WorkingDirectory="client" />
  <Exec Command="npm run build" WorkingDirectory="client" />
</Target>
```

> Keep the root‑level `npm install` behavior for the existing tooling if still needed; the TypeScript MSBuild pipeline for the old `wwwroot/js` will be removed in Task 12. In Debug/dev, the client is served by the Vite dev server, so no client build runs on `dotnet build`.

- [ ] **Step 7: Verify backend build + runtime**

Run: `dotnet build Chavah.NetCore/Chavah.NetCore.csproj`
Expected: build succeeds.

Then run the client dev server and the app together:
```bash
cd Chavah.NetCore/client && npm run dev
# separate shell:
dotnet run --project Chavah.NetCore
```
Expected: navigating to the app shows the `<chavah-app>` shell (header/footer stubs) served by ASP.NET with modules loaded from the Vite dev server; no AngularJS errors in console.

- [ ] **Step 8: Commit**

```bash
git add Chavah.NetCore/Services/ViteAssets.cs Chavah.NetCore/Startup.cs Chavah.NetCore/Views Chavah.NetCore/Chavah.NetCore.csproj
git commit -m "feat(server): serve Vite client, dev CORS, SPA fallback; drop AngularJS shell"
```

---

## Task 5: Port core models and HomeViewModel accessor

**Files:**
- Create: `Chavah.NetCore/client/src/models/*.ts` (Song, User, AudioStatus, Album, Artist, CommunityRankStanding, LikeLevel, SignInStatus, IAlbumSwatch, ServerInterfaces subset)
- Create: `Chavah.NetCore/client/src/shared/home-view-model.ts`

- [ ] **Step 1: Port enums/interfaces**

Port each model from `wwwroot/js/Models` applying these mechanical rules:
- Remove the `namespace BitShuva.Chavah { ... }` wrapper; export the type directly.
- Convert `class Song` methods that depend on AngularJS/tinycolor to plain TS (tinycolor usage → keep a local color util or `culori`/manual; for Phase 1 preserve the album‑color fields already computed server‑side where possible).
- Keep property names identical (`albumArtUri`, `albumColors`, `communityRankStanding`, `hebrewName`, `albumSwatchDarker`, etc.).

Example — `models/audio-status.ts`:
```ts
export enum AudioStatus {
  Paused, Playing, Ended, Erred, Stalled, Buffering, Aborted,
}
```

Example — `models/song.ts` (skeleton; port full method bodies from `wwwroot/js/Models/Song.ts`):
```ts
import { AlbumColors } from "./album-colors";
import { CommunityRankStanding } from "./community-rank-standing";

export interface ISong { /* mirror Server.Song shape from ServerInterfaces.ts */ }

export class Song {
  id!: string;
  name = "";
  hebrewName: string | null = null;
  artist = "";
  album = "";
  albumArtUri = "";
  albumColors!: AlbumColors;
  albumSwatchDarker = "";
  communityRank = 0;
  communityRankStanding!: CommunityRankStanding;
  tags: string[] = [];
  // ... other fields from Song.ts

  static fromDto(dto: ISong): Song { /* port constructor/mapping logic */ return new Song(); }
}
```

> Read the full `Song.ts` and reproduce every method (`communityRankText`, `communityRankStandingText`, `nthSongText`, color computation, share helpers) — these are used verbatim by the now‑playing UI.

- [ ] **Step 2: Create `home-view-model.ts`**

```ts
import type { ISong } from "../models/song";

export interface HomeViewModel {
  user: UserDto | null;
  song: ISong | null;
  embed: boolean;
  autoplay: boolean;
  cdnUrl: string;
  debug: boolean;
  isDownForMaintenance: boolean;
  cacheBustedAngularViews: string[]; // legacy; unused by new client
  // add fields as needed from HomeViewModel.cs
}

export interface UserDto { email: string; isAdmin: boolean; /* ... */ }

export function getHomeViewModel(): HomeViewModel {
  return (window as any)["BitShuva.Chavah.HomeViewModel"] as HomeViewModel;
}
```

> Read `Chavah.NetCore/Models/HomeViewModel.cs` and `UserViewModel` to complete the DTO shapes exactly.

- [ ] **Step 3: Build**

Run: `cd Chavah.NetCore/client && npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/models Chavah.NetCore/client/src/shared/home-view-model.ts
git commit -m "feat(client): port core models + HomeViewModel accessor"
```

---

## Task 6: Port core services

**Files (create):**
- `Chavah.NetCore/client/src/services/http-api-service.ts`
- `Chavah.NetCore/client/src/services/account-service.ts`
- `Chavah.NetCore/client/src/services/app-nav-service.ts`
- `Chavah.NetCore/client/src/services/song-api-service.ts`
- `Chavah.NetCore/client/src/services/like-api-service.ts`
- `Chavah.NetCore/client/src/services/song-batch-service.ts`
- `Chavah.NetCore/client/src/services/audio-player-service.ts`
- `Chavah.NetCore/client/src/services/sharing-service.ts`
- `Chavah.NetCore/client/src/services/song-request-service.ts`
- `Chavah.NetCore/client/src/shared/reactive-store.ts`

Port from `wwwroot/js/Services/*` with these rules for every service:
- Drop the `namespace` wrapper; export a class and a singleton instance (`export const songApi = new SongApiService(httpApi);`) to replace Angular DI.
- Replace `$http` calls with `httpApi` (`fetch`). Replace `$q` with `Promise`. Replace `angular-local-storage` with a `localStorage` wrapper. Replace `moment` with `dates.ts` Intl helpers. Replace `$rootScope.$broadcast/$on` with `reactive-store.ts` events.
- Preserve method names, parameters, and behavior exactly.

- [ ] **Step 1: Create `shared/reactive-store.ts`**

```ts
export type Unsubscribe = () => void;

export class Emitter<T> {
  private listeners = new Set<(v: T) => void>();
  subscribe(fn: (v: T) => void): Unsubscribe { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(v: T) { for (const fn of this.listeners) fn(v); }
}
```

- [ ] **Step 2: Create `shared/dates.ts` (Intl, replaces moment)**

```ts
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const dtf = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function fromNow(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, "minute");
  return rtf.format(Math.round(diffMs / 1000), "second");
}
export function formatDate(date: Date | string): string {
  return dtf.format(typeof date === "string" ? new Date(date) : date);
}
export function formatNumber(n: number): string { return new Intl.NumberFormat().format(n); }
```

- [ ] **Step 3: Create `http-api-service.ts`**

Port `HttpApiService.ts`. Replace `$http` with `fetch`, preserving methods (`get`, `post`, `postUriEncoded`, etc.), credentials (`credentials: "include"` for cookie auth), and error handling.

```ts
export class HttpApiService {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const q = params ? "?" + new URLSearchParams(cleanParams(params)).toString() : "";
    const res = await fetch(url + q, { credentials: "include", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.json() as Promise<T>;
  }
  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
    return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>);
  }
}
function cleanParams(p: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]));
}
export const httpApi = new HttpApiService();
```

> Read `HttpApiService.ts` and add any additional methods used by the ported services (e.g. `postUriEncoded` for form posts to `AccountController`).

- [ ] **Step 4: Create `account-service.ts`**

Port `AccountService.ts`. Preserve `isSignedIn`, `currentUser`, `signIn`, `signOut`, `getUserWithEmail`, etc. Seed `currentUser` from `getHomeViewModel().user`. Expose a `changed` `Emitter` so header/footer re-render on auth changes.

```ts
import { httpApi } from "./http-api-service";
import { getHomeViewModel, UserDto } from "../shared/home-view-model";
import { Emitter } from "../shared/reactive-store";

export class AccountService {
  currentUser: UserDto | null = getHomeViewModel().user;
  readonly changed = new Emitter<UserDto | null>();
  get isSignedIn(): boolean { return !!this.currentUser; }
  // port signIn/signOut/register/etc. from AccountService.ts, calling /api/account/...
}
export const accountService = new AccountService();
```

- [ ] **Step 5: Create the remaining services**

Port each remaining service (`app-nav-service`, `song-api-service`, `like-api-service`, `song-batch-service`, `audio-player-service`, `sharing-service`, `song-request-service`) from its `wwwroot/js/Services` counterpart following the rules above. Key notes:
- **`app-nav-service.ts`**: replace `$location.path("/x")` with `navigateTo("/x")` from `shared/router.ts`. Preserve `signIn()`, `nowPlaying()`, `promptSignIn()`, etc.
- **`audio-player-service.ts`**: drive the `<audio id="audio">` element (rendered by `chavah-footer`). Port play/pause/volume/seek and the `status` `Emitter<AudioStatus>`, `songCompleted`, `playedTimeText`, `durationText`. Replace rxjs subjects with `Emitter`. Preserve buffering/stalled/error handling verbatim.
- **`song-batch-service.ts`** and **`song-api-service.ts`**: preserve the "current + upcoming songs" queue logic that feeds the now‑playing deck.
- **`sharing-service.ts`**: preserve `nativeShare`, `facebookShareUrl`, `twitterShareUrl`, `smsShareUrl`, `whatsAppShareUrl`, `canNativeShare`.

Each service ends with a `export const <name> = new <Class>(deps);` singleton.

- [ ] **Step 6: Build**

Run: `cd Chavah.NetCore/client && npm run build`
Expected: success (routers/services resolve).

- [ ] **Step 7: Commit**

```bash
git add Chavah.NetCore/client/src/services Chavah.NetCore/client/src/shared
git commit -m "feat(client): port core services (http, account, audio, song, likes, sharing, nav)"
```

---

## Task 7: `chavah-header` component

**Files:**
- Create: `Chavah.NetCore/client/src/components/chavah-header.ts`
- Reference: `wwwroot/views/partials/Header.html`, `wwwroot/js/Controllers/HeaderController.ts`, `wwwroot/css/app/header.less`

- [ ] **Step 1: Read the sources**

Read `Header.html`, `HeaderController.ts`, and `header.less` fully. Note the structure: brand title (`Chavah Messianic Radio חוה` in gold `#e9dd9a`), subtitle/desc, go‑back link, notifications dropdown, profile/nav dropdown (My profile, Home, My likes, Trending, Recent, Popular, Install App, Alerts, Discord, Contact, Donate, About, Sign In/Register/Admin/Sign out), and the donation banner.

- [ ] **Step 2: Implement the component**

Map Bootstrap → Web Awesome: `.dropdown` → `<wa-dropdown>`, `.btn btn-link` → `<wa-button appearance="plain">`, `<i class="fa …">` → `<wa-icon>`, tooltips → `<wa-tooltip>`, `.alert` donation banner → `<wa-callout>`. Bind to `accountService` (current user, admin), notifications, and `pwaInstallService`/`pushNotificationService` (port these two lightweight services if referenced; otherwise gate the buttons off for Phase 1 and add in a later batch). Preserve nav targets as path‑based `href` (`/trending`, `/mylikes`, …) so the router intercepts them.

```ts
import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

@customElement("chavah-header")
export class ChavahHeader extends LitElement {
  createRenderRoot() { return this; } // light DOM to reuse header.less-derived styles
  @state() private user = accountService.currentUser;
  private unsub = () => {};

  connectedCallback() { super.connectedCallback(); this.unsub = accountService.changed.subscribe(u => { this.user = u; }); }
  disconnectedCallback() { this.unsub(); super.disconnectedCallback(); }

  render() {
    return html`
      <header>
        <div class="title"><a href="/">Chavah <span class="hidden-xs">Messianic Radio</span>
          <span class="hebrew" lang="he">חוה</span></a></div>
        <!-- notifications + profile <wa-dropdown> menus ported from Header.html -->
      </header>`;
  }
}
```

> Reconcile WA import paths against `llms.txt`. Port every menu item and the notifications dropdown from `Header.html`. Port `header.less` into a co‑located `<style>` / `header.css` imported by the component (light DOM), converting `@brand-color`/`@text-color-light` LESS vars to the `--chavah-*` CSS vars.

- [ ] **Step 3: Build + visual check**

Run: `cd Chavah.NetCore/client && npm run build`; run app + `npm run dev`.
Then use the `use-spiderloop` skill to compare the header against `https://messianicradio.com`. Iterate until the title, gold color, layout, and menu match.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/components/chavah-header.ts
git commit -m "feat(client): chavah-header with Web Awesome dropdowns"
```

---

## Task 8: `chavah-footer` component (audio controls)

**Files:**
- Create: `Chavah.NetCore/client/src/components/chavah-footer.ts`
- Reference: `wwwroot/views/partials/Footer.html`, `wwwroot/js/Controllers/FooterController.ts`, `wwwroot/css/app/footer.less`

- [ ] **Step 1: Read the sources**

Note controls: trackbar/buffering progress, thumb‑down, song request, play/pause, skip (fast‑forward), thumb‑up, track time/duration, volume toggle + slider, and the Discord button. The `<audio id="audio">` element lives here.

- [ ] **Step 2: Implement**

Map: buttons → `<wa-button appearance="plain">` with `<wa-icon>`; volume `<input type="range">` → `<wa-slider min="0" max="1" step="0.1">`; buffering `.progress` → `<wa-progress-bar>` (or a CSS striped bar) shown while `audioPlayer.status === Buffering`; tooltips → `<wa-tooltip>`. Bind clicks to `audioPlayer` (playPause, next, volume) and `likeApi` (thumbUp/thumbDown with disabled state during the call). Render `<audio id="audio">` so `audio-player-service` can bind to it.

```ts
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { audioPlayer } from "../services/audio-player-service";
import { AudioStatus } from "../models/audio-status";

@customElement("chavah-footer")
export class ChavahFooter extends LitElement {
  createRenderRoot() { return this; }
  @state() private status: AudioStatus = AudioStatus.Paused;
  @state() private volume = 1;
  private unsub = () => {};

  connectedCallback() { super.connectedCallback(); this.unsub = audioPlayer.status.subscribe(s => { this.status = s; }); }
  disconnectedCallback() { this.unsub(); super.disconnectedCallback(); }

  private get isPaused() { return this.status !== AudioStatus.Playing; }

  render() {
    return html`
      <section class="footer">
        ${this.status === AudioStatus.Buffering ? html`<wa-progress-bar indeterminate></wa-progress-bar>` : html`<div class="trackbar"></div>`}
        <div class="song-controls"><!-- thumb-down, request, play/pause, skip, thumb-up, volume ported from Footer.html --></div>
        <audio id="audio"></audio>
      </section>`;
  }
}
```

> Port `footer.less` to a light‑DOM stylesheet; keep the fixed‑bottom bar layout and colors. Reconcile WA element/prop names via `llms.txt`.

- [ ] **Step 3: Build + visual + functional check**

Build; run app+dev. Verify play/pause, skip, thumb up/down, volume slider, and buffering indicator work with real audio. Use `use-spiderloop` to match the footer to production.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/components/chavah-footer.ts
git commit -m "feat(client): chavah-footer audio controls with Web Awesome"
```

---

## Task 9: `song-list` and `song-deck` components

**Files:**
- Create: `Chavah.NetCore/client/src/components/song-list.ts`
- Create: `Chavah.NetCore/client/src/components/song-deck.ts`
- Reference: `wwwroot/views/partials/ArtistList.html`? no — `wwwroot/views/SongDeck.html`, `wwwroot/js/Controllers/SongListController.ts`, `SongDeckController.ts`, `wwwroot/css/app/songList.less`, `SongDeck.less`

- [ ] **Step 1: Implement `song-list`**

Port `SongList.html`/`SongListController.ts` (a `songs` collection with loading + "show more"). Accept a `songs` property (the batched collection object with `items`, `isLoading`, `hasMoreItems`, `fetchNextChunk`). Render album art + name/artist with per‑song `albumColors` applied via inline CSS vars. Buttons → `<wa-button>`, spinner → `<wa-spinner>`.

- [ ] **Step 2: Implement `song-deck`**

Port `SongDeck.html`/`SongDeckController.ts`: a list of song cards with album art, name/artist/album/rank, play button, native/share dropdown, and link. Map share menu → `<wa-dropdown>`, buttons → `<wa-button>`, icons → `<wa-icon>`. Apply `song.albumColors` (background/foreground/muted) via CSS custom properties per card.

```ts
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Song } from "../models/song";
import { sharing } from "../services/sharing-service";

@customElement("song-deck")
export class SongDeck extends LitElement {
  createRenderRoot() { return this; }
  @property({ attribute: false }) songs!: { items: Song[]; isLoading: boolean; hasMoreItems: boolean; itemsTotalCount: number; fetchNextChunk: () => void };
  // render ported from SongDeck.html applying song.albumColors as --bg/--fg/--muted vars
  render() { return html``; }
}
```

- [ ] **Step 3: Build + visual check**

Build; run. Use `use-spiderloop` to compare a rendered deck/list against production.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/components/song-list.ts Chavah.NetCore/client/src/components/song-deck.ts
git commit -m "feat(client): song-list and song-deck components"
```

---

## Task 10: `now-playing-page`

**Files:**
- Create: `Chavah.NetCore/client/src/pages/now-playing-page.ts`
- Reference: `wwwroot/views/NowPlaying.html`, `wwwroot/js/Controllers/NowPlayingController.ts`, `wwwroot/css/app/nowPlaying.less`

- [ ] **Step 1: Read sources**

Structure: left pane (Trending / New music / My likes `song-list`s, hidden on xs), center column (song cards deck with pause overlay, current song name + hebrew name, artist button, album button, "Featuring", rank expander `<wa-details>`, tags list with edit‑tags link).

- [ ] **Step 2: Implement**

Port `NowPlayingController.ts` logic: subscribe to `songBatch`/`audioPlayer` to get `songs`, `currentSong`, `isCurrentSongPaused`, `trending`, `newSongs`, `likes`; wire `songClicked`, `pauseOverlayClicked`, `playSongFromCurrentArtist`, `playSongFromCurrentAlbum`, `playSongWithTag`. Use `<song-list>` for the left pane and render the center deck. Apply `currentSong.albumColors`/`albumSwatchDarker` via CSS vars. Rank expander → `<wa-details>`; tag chips → `<wa-button>`/styled spans; edit link → path `href`.

```ts
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { songBatch } from "../services/song-batch-service";
import { audioPlayer } from "../services/audio-player-service";
import type { Song } from "../models/song";
import "../components/song-list";
import "@awesome.me/webawesome/dist/components/details/details.js";

@customElement("now-playing-page")
export class NowPlayingPage extends LitElement {
  createRenderRoot() { return this; }
  @state() private currentSong: Song | null = null;
  // subscribe to songBatch/audioPlayer in connectedCallback; unsubscribe on disconnect
  render() { return html`<section class="page now-playing-page"><!-- ported layout --></section>`; }
}
```

- [ ] **Step 3: Build + visual + functional check**

Build; run with real backend + audio. Verify the deck advances, current song info + rank + tags render, left‑pane lists populate, and colors adapt per song. Use `use-spiderloop` to match `https://messianicradio.com` home.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/pages/now-playing-page.ts
git commit -m "feat(client): now-playing page"
```

---

## Task 11: Sign‑in flow

**Files:**
- Create: `Chavah.NetCore/client/src/pages/prompt-sign-in-page.ts`
- Create: `Chavah.NetCore/client/src/pages/sign-in-page.ts`
- Create: `Chavah.NetCore/client/src/pages/password-page.ts`
- Reference: `wwwroot/views/PromptSignIn.html`, `SignIn.html`, `Password.html` and their controllers; `wwwroot/css/app/password.less`

- [ ] **Step 1: Implement the three pages**

Port each view + controller. Use `<wa-input>` for email/password, `<wa-button variant="brand">` for submit, `<wa-callout variant="danger">` for errors. Wire to `accountService` (`getUserWithEmail`, `signInWithPassword`, etc.) preserving the existing flow: prompt → sign‑in (email) → password. On success, update `accountService.currentUser`, emit `changed`, and `navigateTo("/")`. Preserve the `.account-page/.account-form` styling from `shared.less`.

```ts
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import { navigateTo } from "../shared/router";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";

@customElement("password-page")
export class PasswordPage extends LitElement {
  createRenderRoot() { return this; }
  @state() private error = "";
  params?: { email: string };
  // port Password.html + PasswordController: submit → accountService sign-in → navigateTo("/")
  render() { return html`<section class="page account-page"><!-- ported form --></section>`; }
}
```

- [ ] **Step 2: Enable the routes**

In `shared/router.ts`, ensure `/promptsignin`, `/signin`, `/password/:email` map to these pages (already listed in Task 3). Confirm `appNav.signIn()` targets the correct first step.

- [ ] **Step 3: Build + functional + visual check**

Build; run. Sign in with the flow end‑to‑end using test credentials; verify the header updates to the signed‑in state and `/mylikes` becomes accessible. Use `use-spiderloop` to match the sign‑in screens.

- [ ] **Step 4: Commit**

```bash
git add Chavah.NetCore/client/src/pages
git commit -m "feat(client): sign-in flow (prompt, sign-in, password)"
```

---

## Task 12: Remove dead AngularJS assets; final Phase‑1 validation

**Files:**
- Delete: `Chavah.NetCore/wwwroot/js/**` (AngularJS App/Controllers/Services/Directives/Models), `wwwroot/views/**` (AngularJS HTML templates), `wwwroot/css/app/**` and Bootstrap/bootswatch/flatly LESS, `wwwroot/lib/**` (client libs), old `wwwroot/js/dist`, `wwwroot/css/dist`.
- Modify: `Chavah.NetCore/Chavah.NetCore.csproj` (remove `Microsoft.TypeScript.MSBuild`, `BuildBundlerMinifier`, `BuildWebCompiler`, `Microsoft.Web.LibraryManager.Build`, `TypeScriptCompile`/`Content Remove` items, `tsconfig`/`bundleconfig`/`compilerconfig`/`libman.json`), and remove `Chavah.NetCore/tsconfig.json`, `tslint.json`, `bundleconfig.json`, `compilerconfig.json*`, `libman.json`, and the AngularJS `@types/*` from `Chavah.NetCore/package.json`.
- Modify: `Chavah.NetCore/Common/AngularCacheBustedViews*.cs` and any `AngularCacheBustedViews` DI registration + `HomeViewModel.CacheBustedAngularViews` usage (remove or no‑op), since the new client doesn't use cache‑busted Angular views.

> **Caution:** do this only after Tasks 1–11 are verified working, and delete incrementally, building between deletions. Keep `wwwroot/images`, `favicon.ico`, `manifest.json`, `robots.txt`, `Heavenly70.html`, and `wwwroot/emails`.

- [ ] **Step 1: Remove AngularJS view templates and JS**

```bash
git rm -r Chavah.NetCore/wwwroot/js Chavah.NetCore/wwwroot/views
```

- [ ] **Step 2: Remove old CSS + libs**

```bash
git rm -r Chavah.NetCore/wwwroot/css/app Chavah.NetCore/wwwroot/lib
git rm Chavah.NetCore/wwwroot/css/bootstrap-flatly.less Chavah.NetCore/wwwroot/css/bootswatch.less Chavah.NetCore/wwwroot/css/bootstrap-flatly-tweaks.less Chavah.NetCore/wwwroot/css/nprogress.less
```

- [ ] **Step 3: Remove old build tooling from csproj + delete config files**

Edit `Chavah.NetCore.csproj` to drop the TypeScript/Bundler/WebCompiler/LibMan `PackageReference`s and the `TypeScriptCompile`/`Content Remove`/`MediaFileUpload` items. Then:
```bash
git rm Chavah.NetCore/tsconfig.json Chavah.NetCore/tslint.json Chavah.NetCore/bundleconfig.json Chavah.NetCore/compilerconfig.json Chavah.NetCore/compilerconfig.json.defaults Chavah.NetCore/libman.json
```

- [ ] **Step 4: Remove `AngularCacheBustedViews` wiring**

Remove the service, its DI registration, and the `CacheBustedAngularViews` property assignment in `HomeController` (`homeViewModel.CacheBustedAngularViews = _ngViews.Views;`) and on `HomeViewModel`. Leave the rest of `HomeViewModel` intact.

- [ ] **Step 5: Full build**

Run:
```bash
cd Chavah.NetCore/client && npm run build
cd ../.. && dotnet build Chavah.NetCore/Chavah.NetCore.csproj
```
Expected: both succeed with no references to removed files.

- [ ] **Step 6: Full runtime + visual regression**

Run client dev + `dotnet run`. Exercise: home/now‑playing (playback, thumbs, skip, request, volume), header nav + dropdowns, footer, and the sign‑in flow. Use `use-spiderloop` for a final side‑by‑side of header, footer, now‑playing, and sign‑in vs production.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove AngularJS assets and legacy build tooling"
```

---

## Self-review notes

- **Spec coverage:** in‑place client (Tasks 1,4), WA theming + `#2f3d58` (Task 2), Navigation API routing + SPA fallback + legacy hash redirect (Tasks 3,4), Vite dev proxy/serve (Tasks 1,4), Web Awesome components (Tasks 7–11), service port incl. Intl (Tasks 5,6), album‑color theming (Tasks 9,10), sign‑in (Task 11), backend untouched except additive fallback/CORS (Task 4), phased scope = core experience (all tasks), spiderloop validation (Tasks 7–12). All spec sections map to tasks.
- **Placeholders:** infra code (Tasks 1–4) is complete and exact. Port tasks (5–11) name exact source→dest files with mechanical transformation rules + representative skeletons; full method bodies are reproduced from the in‑repo source during implementation (the source is authoritative, not a placeholder).
- **Type consistency:** `accountService`, `appNav`/`navigateTo`, `audioPlayer.status` (Emitter), `AudioStatus`, `Song`, `getHomeViewModel()`, `ViteAssets` names are used consistently across tasks.
```
