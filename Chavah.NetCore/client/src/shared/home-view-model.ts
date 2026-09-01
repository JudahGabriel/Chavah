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

/** Reads the server-injected bootstrap view model from the global window object. */
export function getHomeViewModel(): HomeViewModel {
  if (cached) {
    return cached;
  }

  const model = (window as unknown as Record<string, unknown>)[HOME_VIEW_MODEL_KEY];
  if (!model) {
    throw new Error(
      `Missing bootstrap view model. Expected window["${HOME_VIEW_MODEL_KEY}"] to be set by the server.`,
    );
  }

  cached = model as HomeViewModel;
  return cached;
}
