import { songApi } from "./song-api-service";
import { getHomeViewModel, type HomeViewModel } from "../shared/home-view-model";
import { BehaviorSubject, Subject } from "../shared/reactive-store";
import { formatMinutesSeconds } from "../shared/dates";
import { AudioStatus } from "../models/audio-status";
import type { Song } from "../models/song";
import type { IAudioErrorInfo } from "../models/audio-error-info";

/**
 * Drives HTML5 audio playback and exposes reactive playback state. Ported from
 * the AngularJS `AudioPlayerService`; `Rx.BehaviorSubject`/`Rx.Subject` become
 * our reactive-store equivalents, `moment(...).format("m:ss")` becomes
 * `formatMinutesSeconds`, and the iOS native-audio branch (`IOSAudioPlayer`) is
 * dropped for the web-only Phase 1 build.
 */
export class AudioPlayerService {
  readonly status = new BehaviorSubject(AudioStatus.Paused);
  readonly song = new BehaviorSubject<Song | null>(null);
  readonly songCompleted = new BehaviorSubject<Song | null>(null);
  readonly playedTime = new BehaviorSubject<number>(0);
  readonly playedTimeText = new BehaviorSubject<string>("");
  readonly remainingTimeText = new BehaviorSubject<string>("");
  readonly playedTimePercentage = new BehaviorSubject<number>(0);
  readonly duration = new BehaviorSubject<number>(0);
  playedSongs: Song[] = [];
  readonly error = new Subject<IAudioErrorInfo>();

  private audio!: HTMLAudioElement;
  private readonly homeViewModel: HomeViewModel = getHomeViewModel();
  private lastPlayedTime = 0;

  constructor() {
    // Listen for when the song changes and update the document title.
    this.song.subscribe((song) => this.updateDocumentTitle(song));
  }

  initialize(audio: HTMLAudioElement): void {
    this.audio = audio;

    this.audio.addEventListener("ended", () => this.ended());
    this.audio.addEventListener("error", (args) => this.erred(args));
    this.audio.addEventListener("pause", () => this.status.onNext(AudioStatus.Paused));
    this.audio.addEventListener("play", () => this.status.onNext(AudioStatus.Playing));
    this.audio.addEventListener("playing", () => this.status.onNext(AudioStatus.Playing));
    this.audio.addEventListener("waiting", () => this.status.onNext(AudioStatus.Buffering));
    this.audio.addEventListener("stalled", (args) => this.stalled(args));
    this.audio.addEventListener("timeupdate", () => this.playbackPositionChanged());
  }

  playNewSong(song: Song): void {
    const currentSong = this.song.getValue();
    if (currentSong) {
      this.playedSongs.unshift(currentSong);
      if (this.playedSongs.length > 3) {
        this.playedSongs.length = 3;
      }
    }

    this.song.onNext(song);
    this.playNewUri(song.uri);
  }

  playNewUri(uri: string): void {
    if (this.audio) {
      if (this.audio.src === uri) {
        this.audio.currentTime = 0;
      }

      if (uri) {
        this.audio.src = uri;
        this.audio.load();

        try {
          // On modern browsers, play will return a promise.
          this.audio
            .play()
            .catch((error) =>
              console.log("Unable to play audio due to error, possibly due to no interaction.", error),
            );
        } catch (error) {
          // This can happen on mobile when we try to play before user interaction.
          // Don't worry about it; it will remain paused until the user clicks play.
          console.log("Unable to play audio", error);
        }
      }
    }
  }

  playSongById(songId: string): void {
    const task = songApi.getSongById(songId);
    this.playSongWhenFinishedLoading(task);
  }

  playSongAtTrackPosition(songId: string, trackPosition: number): void {
    if (songId) {
      const loadSongTask = songApi.getSongById(songId);
      this.playSongWhenFinishedLoading(loadSongTask).then((loadedSong) => {
        if (loadedSong && loadedSong.id === songId) {
          this.audio.currentTime = trackPosition;
        }
      });
    }
  }

  playSongFromArtistAndAlbum(artist: string, album: string): void {
    const task = songApi.getSongByArtistAndAlbum(artist, album);
    this.playSongWhenFinishedLoading(task);
  }

  playSongFromArtist(artist: string): void {
    const task = songApi.getSongByArtist(artist);
    this.playSongWhenFinishedLoading(task);
  }

  playSongFromArtistId(artist: string): void {
    const task = songApi.getSongByArtistId(artist);
    this.playSongWhenFinishedLoading(task);
  }

  playSongFromAlbum(album: string): void {
    const task = songApi.getSongByAlbum(album);
    this.playSongWhenFinishedLoading(task);
  }

  playSongFromAlbumId(albumId: string): void {
    const task = songApi.getSongByAlbumId(albumId);
    this.playSongWhenFinishedLoading(task);
  }

  playSongWithTag(tag: string): void {
    const task = songApi.getSongWithTag(tag);
    this.playSongWhenFinishedLoading(task);
  }

  playSongWhenFinishedLoading(task: Promise<Song | null>): Promise<Song | null> {
    const currentSong = this.song.getValue();
    this.pause();

    return task.then((songResult) => {
      const isStillWaitingForSong = this.song.getValue() === currentSong;
      if (isStillWaitingForSong) {
        if (songResult) {
          this.playNewSong(songResult);
          return songResult;
        } else {
          this.resume();
        }
      }

      return this.song.getValue();
    });
  }

  pauseSongById(songId: string): void {
    this.pause();

    songApi.getSongById(songId).then((song) => {
      if (!song) {
        this.resume();
        return;
      }

      const unwrappedSong = this.song.getValue();
      if (unwrappedSong) {
        this.playedSongs.unshift(unwrappedSong);
      }

      // Set the current song and URI. But don't play it.
      this.song.onNext(song);
      if (this.audio) {
        this.audio.src = song.uri;
        this.audio.load();
        this.audio.pause();
      }
    });
  }

  resume(): void {
    if (this.audio) {
      this.audio.play();
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  get volume(): number {
    if (this.audio) {
      return this.audio.volume;
    }

    return 1;
  }

  /**
   * Sets the volume level.
   * @param level Should be between 0 and 1, where 1 is full volume and 0 is muted.
   */
  set volume(level: number) {
    if (this.audio) {
      this.audio.volume = level;
    }
  }

  skipToEnd(): void {
    if (this.audio && this.audio.duration) {
      this.audio.currentTime = this.audio.duration - 1;
    }
  }

  private erred(args: ErrorEvent): void {
    this.status.onNext(AudioStatus.Erred);
    const currentSong = this.song.getValue();
    const errorInfo: IAudioErrorInfo = {
      errorCode: this.audio.error?.code || null,
      songId: currentSong ? currentSong.id : "",
      trackPosition: this.audio.currentTime,
      mp3Url: this.audio.src || "",
      errorMessage: args.message,
      errorDetails: `${args.error}`,
    };
    this.error.onNext(errorInfo);
  }

  private ended(): void {
    const currentSong = this.song.getValue();
    if (
      this.audio &&
      currentSong &&
      (this.audio.src === currentSong.uri || this.audio.src === encodeURI(currentSong.uri))
    ) {
      this.songCompleted.onNext(currentSong);
    }

    this.status.onNext(AudioStatus.Ended);
  }

  private stalled(args: Event): void {
    this.status.onNext(AudioStatus.Stalled);
    console.warn("Audio stalled, unable to stream in audio data.", this.audio.src, args);
  }

  private playbackPositionChanged(): void {
    const currentTime = this.audio.currentTime;
    const currentTimeRounded = isNaN(currentTime) || !isFinite(currentTime) ? 0 : Math.round(currentTime);
    const currentTimeHasChanged = currentTimeRounded !== this.lastPlayedTime;
    if (currentTimeHasChanged) {
      this.lastPlayedTime = currentTimeRounded;

      // Update our duration and current time.
      const duration = this.audio.duration;
      this.duration.onNext(isNaN(duration) || !isFinite(duration) ? 0 : duration);
      this.playedTime.onNext(currentTimeRounded);

      this.playedTimeText.onNext(formatMinutesSeconds(currentTimeRounded));
      this.remainingTimeText.onNext(formatMinutesSeconds(duration - currentTimeRounded));
      this.playedTimePercentage.onNext((100 / duration) * currentTimeRounded);
    }
  }

  private updateDocumentTitle(song: Song | null): void {
    // Update the document title so that the browser tab updates.
    if (song) {
      document.title = `${song.name} by ${song.artist} on ${this.homeViewModel.pageTitle}`;
    } else {
      document.title = this.homeViewModel.pageTitle;
    }
  }
}

export const audioPlayer = new AudioPlayerService();
