import { httpApi } from "./http-api-service";
import { audioPlayer } from "./audio-player-service";
import { songApi, SongApiService } from "./song-api-service";
import { accountService } from "./account-service";
import { getHomeViewModel, type HomeViewModel } from "../shared/home-view-model";
import { randomNumber } from "../shared/utils";
import { SongPick } from "../models/song-pick";
import type { Song } from "../models/song";

/**
 * Manages the song-request queue and announcements. Ported from the AngularJS
 * `SongRequestApiService`; lodash helpers (`_.without`, `_.last`) become native
 * array operations, the injected services become singletons, and the
 * `signedInState` subscription uses our reactive-store operators.
 */
export class SongRequestApiService {
  private pendingSongRequestIds: string[] = [];
  private hasPlayedRequestAnnouncement = false;
  private anonUserPlayedSongIds: string[] | null = null;
  private lastFetchRequestsTime: number | null = null;

  private static readonly anonUserPlayedSongIdsKey = "songrequests-anonUserPlayedSongIds";

  private readonly homeViewModel: HomeViewModel = getHomeViewModel();

  constructor() {
    // When the user signs in, we need to let the server know that we
    // may have heard some song requests while signed out.
    accountService.signedInState
      .distinctUntilChanged()
      .where((i) => i === true)
      .subscribe(() => this.userSignedIn());
  }

  hasPendingRequest(): boolean {
    const hasPendingRequest = this.pendingSongRequestIds.length > 0;
    if (this.pendingSongRequestIds.length === 0) {
      setTimeout(() => this.fetchPendingSongRequests(), 5000);
    }

    return hasPendingRequest;
  }

  isSongPendingRequest(songId: string): boolean {
    return this.pendingSongRequestIds.indexOf(songId) !== -1;
  }

  requestSong(song: Song): Promise<any> {
    this.pendingSongRequestIds.unshift(song.id);
    this.hasPlayedRequestAnnouncement = false;

    const args = { songId: song.id };
    return httpApi.postUriEncoded("/api/songRequests/requestsong", args);
  }

  playRequest(): void {
    if (!this.hasPendingRequest()) {
      throw new Error("There was no pending song request.");
    }

    if (!this.hasPlayedRequestAnnouncement) {
      this.hasPlayedRequestAnnouncement = true;
      const availableSongRequestAnnouncements = 17;
      const songRequestAnnouncementNumber = randomNumber(1, availableSongRequestAnnouncements);
      const songRequestName = "SongRequest" + songRequestAnnouncementNumber + ".mp3";
      const songRequestUrl = `${this.homeViewModel.soundEffects}/${songRequestName}`;
      audioPlayer.playNewUri(songRequestUrl);
    } else {
      // We've already played the song req announcement - yay!
      // Now we actually played the requested song.
      this.hasPlayedRequestAnnouncement = false;
      const pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
      const currentSong = audioPlayer.song.getValue();
      songApi.getSongById(pendingRequestedSongId, SongPick.SomeoneRequestedSong).then((song) => {
        const isStillWaitingForSong = audioPlayer.song.getValue() === currentSong;
        if (isStillWaitingForSong && song) {
          audioPlayer.playNewSong(song);
          this.addAnonUserPlayedSong(song.id);
        }
      });
    }
  }

  getRandomRecentlyRequestedSongs(count: number): Promise<Song[]> {
    const args = { count };
    return httpApi.query(
      "/api/songRequests/getRandomRecentlyRequestedSongs",
      args,
      SongApiService.songListConverter,
    );
  }

  private fetchPendingSongRequests(): void {
    // If we checked in the last 30 seconds, don't check again.
    const sixtySecondsInMS = 30000;
    const now = Date.now();
    const shouldAskServer =
      this.lastFetchRequestsTime === null || now - this.lastFetchRequestsTime > sixtySecondsInMS;

    if (shouldAskServer) {
      this.lastFetchRequestsTime = now;

      // Are we signed in? Get a pending song request for our user.
      if (accountService.isSignedIn) {
        this.fetchRequestForCurrentUser();
      } else {
        // Not signed in? Find recent song requests that we haven't listened to.
        this.fetchRequestForAnonymous();
      }
    }
  }

  private async fetchRequestForCurrentUser(): Promise<void> {
    const songId = await httpApi.query<string | null>("/api/songRequests/getPending");
    if (songId && this.pendingSongRequestIds.indexOf(songId) === -1) {
      this.pendingSongRequestIds.push(songId);
    }
  }

  private async fetchRequestForAnonymous(): Promise<void> {
    // First, grab any pending song requests from the server.
    const recentRequestSongIds = await httpApi.query<string[]>("/api/songRequests/getRecentRequestedSongIds");

    // Skip any that we've already played.
    const playedSongIds = this.getAnonUserPlayedSongIds();
    const unplayedSongIds = recentRequestSongIds.filter((id) => !playedSongIds.includes(id));
    const unplayedNotYetPending = unplayedSongIds.filter((id) => !this.pendingSongRequestIds.includes(id));

    // Grab the last one and add it to our pending list.
    const lastUnplayedNotYetPending = unplayedNotYetPending[unplayedNotYetPending.length - 1];
    if (lastUnplayedNotYetPending) {
      this.pendingSongRequestIds.push(lastUnplayedNotYetPending);
    }
  }

  private getAnonUserPlayedSongIds(): string[] {
    if (!this.anonUserPlayedSongIds) {
      // Rehydrate them from local storage.
      // We need to store them in local storage, otherwise the user
      // may hear duplicate song requests if he closes Chavah and
      // quickly reopens it.
      try {
        const json = localStorage.getItem(SongRequestApiService.anonUserPlayedSongIdsKey);
        if (json) {
          this.anonUserPlayedSongIds = JSON.parse(json);
        }
      } catch (error) {
        console.log("failed to rehydrate anonymous user's played song IDs", error);
        this.anonUserPlayedSongIds = [];
      }
    }

    if (!this.anonUserPlayedSongIds) {
      this.anonUserPlayedSongIds = [];
    }

    return this.anonUserPlayedSongIds;
  }

  private addAnonUserPlayedSong(songId: string): void {
    // If we're anonymous, update the list of played song IDs.
    if (!accountService.isSignedIn) {
      const playedSongIds = this.getAnonUserPlayedSongIds();
      playedSongIds.unshift(songId);
      this.updateAnonymousUserPlayedSongIds(this.getAnonUserPlayedSongIds());
    }
  }

  private updateAnonymousUserPlayedSongIds(songIds: string[]): void {
    if (!songIds) {
      songIds = [];
    }
    const maxPlayedSongs = 10;
    if (songIds.length > maxPlayedSongs) {
      songIds.length = 10;
    }

    try {
      localStorage.setItem(SongRequestApiService.anonUserPlayedSongIdsKey, JSON.stringify(songIds));
    } catch (error) {
      console.log("Unable to store anonymous user song IDs", error);
    }

    this.anonUserPlayedSongIds = songIds;
  }

  private userSignedIn(): void {
    const songsPlayedWhileAnonymous = this.getAnonUserPlayedSongIds();
    if (songsPlayedWhileAnonymous && songsPlayedWhileAnonymous.length) {
      httpApi.post("/api/songRequests/markAsPlayed", songsPlayedWhileAnonymous);
    }
  }
}

export const songRequestApi = new SongRequestApiService();
