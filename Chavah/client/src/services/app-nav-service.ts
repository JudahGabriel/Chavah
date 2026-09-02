// Navigation service ported from the AngularJS `AppNavService`. `$location.url()`
// calls become the Navigation API-based `navigateTo`. The Bootstrap `$uibModal`
// methods (song-request/crop-image/confirm dialogs, etc.) are out of Phase 1
// scope and will be reintroduced with Web Awesome dialogs in a later task.
//
// `navigateTo` is imported here but only invoked inside methods (runtime), so the
// circular import with the router is safe.
import { navigateTo } from "../shared/router";

export class AppNavService {
  readonly promptSignInUrl = "#/promptsignin";

  signIn(): void {
    navigateTo("/signin");
  }

  signOut(): void {
    navigateTo("/nowplaying");
  }

  nowPlaying(): void {
    navigateTo("/nowplaying");
  }

  promptSignIn(): void {
    navigateTo("/signin");
  }

  register(attemptedEmail?: string): void {
    if (attemptedEmail) {
      navigateTo(`/register/${encodeURIComponent(attemptedEmail)}`);
    } else {
      navigateTo("/register");
    }
  }

  createPassword(email: string): void {
    navigateTo(`/createpassword/${encodeURIComponent(email)}`);
  }

  password(email: string): void {
    navigateTo(`/password/${encodeURIComponent(email)}`);
  }

  resetPwnedPassword(email: string): void {
    navigateTo(`/forgotpassword/${encodeURIComponent(email)}/true`);
  }

  editAlbumById(albumId: string): void {
    navigateTo("/admin/album/" + albumId);
  }

  editAlbum(artist: string, album: string): void {
    const escapedArtist = encodeURIComponent(artist);
    const escapedAlbum = encodeURIComponent(album);
    navigateTo(`/admin/album/${escapedArtist}/${escapedAlbum}`);
  }

  getEditSongUrl(songId: string): string {
    return `/edit/${songId}`;
  }

  createAlbum(): void {
    navigateTo("/admin/album/create");
  }

  /** Gets the client-side query parameters, returned as an object map. */
  getQueryParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }
}

export const appNav = new AppNavService();
