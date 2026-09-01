import type { HomeViewModel as ServerHomeViewModel, User as ServerUser } from "../models/server-interfaces";

/**
 * The bootstrap view model the ASP.NET backend serializes into the page as
 * `window["BitShuva.Chavah.HomeViewModel"]` (see Views/Home/Index.cshtml).
 */
export type HomeViewModel = ServerHomeViewModel;

/** The raw server User DTO carried on the HomeViewModel (distinct from the domain `User` class). */
export type UserDto = ServerUser;

const HOME_VIEW_MODEL_KEY = "BitShuva.Chavah.HomeViewModel";

let cached: HomeViewModel | null = null;

/** A safe fallback used when the server hasn't injected the model (e.g. the standalone Vite dev server). */
function createDefaultHomeViewModel(): HomeViewModel {
  return {
    debug: false,
    redirect: null,
    embed: false,
    autoplay: false,
    defaultUrl: window.location.origin,
    cdnUrl: "",
    soundEffects: "",
    pageTitle: "Chavah Messianic Radio",
    pageDescription: "music for Yeshua's disciples",
    descriptiveImageUrl: "",
    song: null,
    user: null,
    isDownForMaintenance: false,
    pushNotificationsPublicKey: "",
    filePickrKey: "",
  };
}

/**
 * Reads the server-injected bootstrap view model from the global window object.
 * Falls back to a default model when it's absent so the app still boots under
 * the standalone Vite dev server (used by spiderloop visual checks).
 */
export function getHomeViewModel(): HomeViewModel {
  if (cached) {
    return cached;
  }

  const model = (window as unknown as Record<string, unknown>)[HOME_VIEW_MODEL_KEY];
  if (model) {
    cached = model as HomeViewModel;
  } else {
    console.warn(`Missing window["${HOME_VIEW_MODEL_KEY}"]; using default view model (dev fallback).`);
    cached = createDefaultHomeViewModel();
  }

  return cached;
}
