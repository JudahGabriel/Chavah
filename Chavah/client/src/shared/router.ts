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
