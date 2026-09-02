import "urlpattern-polyfill";
import { RouteAccess, AppRoute } from "./constants";
import { accountService } from "../services/account-service";
import { appNav } from "../services/app-nav-service";

const routes: AppRoute[] = [
  { pattern: "/", access: RouteAccess.Anonymous, tag: "now-playing-page", load: () => import("../pages/now-playing-page") },
  { pattern: "/nowplaying", access: RouteAccess.Anonymous, tag: "", load: async () => {}, redirectTo: "/" },
  { pattern: "/promptsignin", access: RouteAccess.Anonymous, tag: "prompt-sign-in-page", load: () => import("../pages/prompt-sign-in-page") },
  { pattern: "/signin", access: RouteAccess.Anonymous, tag: "sign-in-page", load: () => import("../pages/sign-in-page") },
  { pattern: "/password/:email", access: RouteAccess.Anonymous, tag: "password-page", load: () => import("../pages/password-page") },
  { pattern: "/trending", access: RouteAccess.Anonymous, tag: "trending-page", load: () => import("../pages/trending-page") },
  { pattern: "/popular", access: RouteAccess.Anonymous, tag: "popular-page", load: () => import("../pages/popular-page") },
  { pattern: "/recent", access: RouteAccess.Anonymous, tag: "recent-page", load: () => import("../pages/recent-page") },
  { pattern: "/mylikes", access: RouteAccess.Authenticated, tag: "my-likes-page", load: () => import("../pages/my-likes-page") },

  // Info / static
  { pattern: "/about", access: RouteAccess.Anonymous, tag: "about-page", load: () => import("../pages/about-page") },
  { pattern: "/privacy", access: RouteAccess.Anonymous, tag: "privacy-page", load: () => import("../pages/privacy-page") },
  { pattern: "/support", access: RouteAccess.Anonymous, tag: "support-page", load: () => import("../pages/support-page") },
  { pattern: "/welcome", access: RouteAccess.Anonymous, tag: "welcome-page", load: () => import("../pages/welcome-page") },
  { pattern: "/maintenance", access: RouteAccess.Anonymous, tag: "maintenance-page", load: () => import("../pages/maintenance-page") },
  { pattern: "/sharethanks{/:artist}?", access: RouteAccess.Anonymous, tag: "share-thanks-page", load: () => import("../pages/share-thanks-page") },
  { pattern: "/songeditapproved/:artist/:songName", access: RouteAccess.Anonymous, tag: "song-edit-approved-page", load: () => import("../pages/song-edit-approved-page") },

  // Auth
  { pattern: "/forgotpassword{/:email}?{/:pwned}?", access: RouteAccess.Anonymous, tag: "forgot-password-page", load: () => import("../pages/forgot-password-page") },
  { pattern: "/createpassword/:email", access: RouteAccess.Anonymous, tag: "create-password-page", load: () => import("../pages/create-password-page") },
  { pattern: "/register{/:email}?", access: RouteAccess.Anonymous, tag: "register-page", load: () => import("../pages/register-page") },
  { pattern: "/confirmemail/:email/:confirmCode", access: RouteAccess.Anonymous, tag: "confirm-email-page", load: () => import("../pages/confirm-email-page") },
  { pattern: "/resetpassword/:email/:confirmCode", access: RouteAccess.Anonymous, tag: "reset-password-page", load: () => import("../pages/reset-password-page") },

  // Profile / content
  { pattern: "/profile", access: RouteAccess.Authenticated, tag: "profile-page", load: () => import("../pages/profile-page") },
  { pattern: "/edit/songs/:id", access: RouteAccess.Authenticated, tag: "edit-song-page", load: () => import("../pages/edit-song-page") },
  { pattern: "/donate{/:artist}?", access: RouteAccess.Anonymous, tag: "donate-page", load: () => import("../pages/donate-page") },
  { pattern: "/donatesuccess", access: RouteAccess.Anonymous, tag: "donate-success-page", load: () => import("../pages/donate-success-page") },
  { pattern: "/donatecancelled", access: RouteAccess.Anonymous, tag: "donate-cancelled-page", load: () => import("../pages/donate-cancelled-page") },
  { pattern: "/music/submission", access: RouteAccess.Anonymous, tag: "music-submission-page", load: () => import("../pages/music-submission-page") },

  // Admin (E1: list/simple pages)
  { pattern: "/admin/users", access: RouteAccess.Admin, tag: "admin-users-page", load: () => import("../pages/admin-users-page") },
  { pattern: "/admin/donations", access: RouteAccess.Admin, tag: "admin-donations-page", load: () => import("../pages/admin-donations-page") },
  { pattern: "/admin/ioslogs", access: RouteAccess.Admin, tag: "admin-ioslogs-page", load: () => import("../pages/admin-ioslogs-page") },
  { pattern: "/admin/logs", access: RouteAccess.Admin, tag: "admin-log-editor-page", load: () => import("../pages/admin-log-editor-page") },
  { pattern: "/admin/tags", access: RouteAccess.Admin, tag: "admin-tag-editor-page", load: () => import("../pages/admin-tag-editor-page") },
  { pattern: "/admin/albums/submissions", access: RouteAccess.Admin, tag: "admin-album-submissions-page", load: () => import("../pages/admin-album-submissions-page") },

  // Admin (E2: editors)
  { pattern: "/admin", access: RouteAccess.Admin, tag: "admin-edit-songs-page", load: () => import("../pages/admin-edit-songs-page") },
  { pattern: "/admin/songs", access: RouteAccess.Admin, tag: "", load: async () => {}, redirectTo: "/admin" },
  { pattern: "/admin/songedits", access: RouteAccess.Admin, tag: "admin-approve-song-edits-page", load: () => import("../pages/admin-approve-song-edits-page") },
  { pattern: "/admin/albums", access: RouteAccess.Admin, tag: "admin-albums-page", load: () => import("../pages/admin-albums-page") },
  { pattern: "/admin/album/upload", access: RouteAccess.Admin, tag: "admin-upload-album-page", load: () => import("../pages/admin-upload-album-page") },
  { pattern: "/admin/album/create", access: RouteAccess.Admin, tag: "admin-edit-album-page", load: () => import("../pages/admin-edit-album-page") },
  { pattern: "/admin/album/:artist/:album", access: RouteAccess.Admin, tag: "admin-edit-album-page", load: () => import("../pages/admin-edit-album-page") },
  { pattern: "/admin/artists{/:artistName}?", access: RouteAccess.Admin, tag: "admin-edit-artist-page", load: () => import("../pages/admin-edit-artist-page") },
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
