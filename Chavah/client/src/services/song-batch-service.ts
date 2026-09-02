import { audioPlayer } from "./audio-player-service";
import { songApi, SongApiService } from "./song-api-service";
import { songRequestApi } from "./song-request-service";
import { accountService } from "./account-service";
import { List } from "../shared/list";
import { BehaviorSubject } from "../shared/reactive-store";
import type { Song } from "../models/song";

/**
 * Fetches a group of songs in a single remote call so the UI can quickly play
 * the next song without extra round-trips. Ported from the AngularJS
 * `SongBatchService`; injected services become singletons and
 * `Rx.BehaviorSubject`/`common/List` become their reactive-store/`shared`
 * equivalents.
 */
export class SongBatchService {
  // Event used for notifying components that songs are available.
  songsBatch = new BehaviorSubject<Song[]>([]);

  // Songs list used for caching.
  private songsList = new List<Song>(
    () => this.fetchSongBatch(),
    "songsbatchV2",
    SongApiService.songConverter,
    (loadedSongs) => this.songsBatch.onNext(loadedSongs),
  );

  constructor() {
    // Listen for when we sign in. When that happens, we want to refresh our song batch.
    // Refreshing the batch updates the song like statuses, etc. of the songs in the batch.
    accountService.signedInState
      .skip(1) // skip the current value
      .distinctUntilChanged()
      .subscribe((signedIn) => this.signedInChanged(signedIn));
  }

  playNext(): void {
    // Play any song remaining from the batch.
    const firstSongInList: Song | undefined = this.songsList.items[0];
    if (firstSongInList) {
      const songsAfterFirst = this.songsList.items.slice(1);
      this.updateSongBatch(songsAfterFirst);
      audioPlayer.playNewSong(firstSongInList);
    } else {
      // Woops, we don't have any songs at all. Request just one (fast), then ask for a batch.
      songApi.chooseSong().then((song) => audioPlayer.playNewSong(song));
    }

    const needMoreSongs = this.songsList.items.length < 3;
    if (needMoreSongs) {
      this.songsList.fetch();
    }
  }

  /**
   * Plays a song that's in the song batch queue but may not be the next item.
   * If the song is queued, it's moved to the next position and played immediately.
   */
  playQueuedSong(song: Song): void {
    const songBatch = this.songsBatch.getValue();
    const songIndex = songBatch.indexOf(song);
    if (songIndex >= 0) {
      // Pull it from the queue.
      songBatch.splice(songIndex, 1);
    }

    // Put it as the next song and then play it.
    songBatch.splice(0, 0, song);
    this.updateSongBatch(songBatch);
    this.playNext();
  }

  private fetchSongBatch(): Promise<Song[]> {
    return songApi.chooseSongBatch().then((results) => {
      // Return the current song batch plus the new songs, excluding any that are
      // already in the song request queue.
      const combinedBatch = this.songsList.items
        .concat(results)
        .filter((s) => !songRequestApi.isSongPendingRequest(s.id));
      this.songsBatch.onNext(combinedBatch);
      return combinedBatch;
    });
  }

  private signedInChanged(isSignedIn: boolean): void {
    const hasBatchSongs = this.songsBatch.getValue().length > 0;
    if (isSignedIn && hasBatchSongs) {
      // Discard the current batch and fetch a fresh batch.
      this.updateSongBatch([]);
      this.songsList.fetch();
    }
  }

  private updateSongBatch(songs: Song[]): void {
    this.songsList.items.length = 0;
    this.songsList.items.push(...songs);
    this.songsList.cache();
    this.songsBatch.onNext(songs);
  }
}

export const songBatch = new SongBatchService();
