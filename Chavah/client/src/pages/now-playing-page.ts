import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { audioPlayer } from "../services/audio-player-service";
import { songBatch } from "../services/song-batch-service";
import { songApi, SongApiService } from "../services/song-api-service";
import { songRequestApi } from "../services/song-request-service";
import { accountService } from "../services/account-service";
import { List } from "../shared/list";
import { Song } from "../models/song";
import { SongPick } from "../models/song-pick";
import { AudioStatus } from "../models/audio-status";
import "../components/song-list";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";

/**
 * The home / now-playing page: the signature album-art card stack with a pause
 * overlay, the current song's name/artist/album, a rank expander, tags, and the
 * left-pane Trending / New music / My likes song lists. Ported from
 * `views/NowPlaying.html` + `NowPlayingController.ts` + `css/app/nowPlaying.less`.
 */
@customElement("now-playing-page")
export class NowPlayingPage extends LitElement {
  // Light DOM so the ported styles and global.css apply normally.
  createRenderRoot() {
    return this;
  }

  @state() private currentSong: Song | null = null;
  @state() private songs: Song[] = [];
  @state() private paused = false;

  // Left-pane lists, mirroring NowPlayingController.
  readonly trending = new List<Song>(
    () => songApi.getTrendingSongs(0, 3).then((r) => r.items),
    "trending",
    SongApiService.songConverter,
  );
  readonly likes = new List<Song>(() => songApi.getRandomLikedSongs(3), "mylikes", SongApiService.songConverter);
  readonly newSongs = new List<Song>(
    () => songApi.getRandomNewSongs(3),
    "newSongs",
    SongApiService.songConverter,
  );

  // Right-pane lists.
  readonly recent = new List<Song>(() => this.getRecentPlays(), "recent", SongApiService.songConverter);
  readonly popular = new List<Song>(() => songApi.getRandomPopular(3), "popular", SongApiService.songConverter);
  readonly recentSongRequests = new List<Song>(
    () => songRequestApi.getRandomRecentlyRequestedSongs(3),
    "recentRequests",
    SongApiService.songConverter,
  );

  private subscriptions: Array<() => void> = [];

  connectedCallback(): void {
    super.connectedCallback();

    this.subscriptions.push(
      audioPlayer.song.subscribe((song) => this.nextSongBeginning(song)),
      audioPlayer.status.subscribe((status) => {
        this.paused = status === AudioStatus.Paused;
      }),
      audioPlayer.songCompleted.subscribe((song) => {
        if (song) {
          songApi.songCompleted(song.id);
        }
      }),
      songBatch.songsBatch.subscribe(() => {
        this.songs = this.getSongs();
      }),
      // Refresh the left-pane lists when they load so we re-render.
      this.trending.changed.subscribe(() => this.requestUpdate()),
      this.likes.changed.subscribe(() => this.requestUpdate()),
      this.newSongs.changed.subscribe(() => this.requestUpdate()),
      this.recent.changed.subscribe(() => this.requestUpdate()),
      this.popular.changed.subscribe(() => this.requestUpdate()),
      this.recentSongRequests.changed.subscribe(() => this.requestUpdate()),
    );

    // Play the next song if we don't already have one playing (i.e. first load).
    if (!audioPlayer.song.getValue()) {
      if (!this.playSongInUrlQuery()) {
        songBatch.playNext();
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.subscriptions.forEach((unsub) => unsub());
    this.subscriptions = [];
  }

  private get isCurrentSongPaused(): boolean {
    return !!this.currentSong && this.paused;
  }

  private getSongs(): Song[] {
    const batch = songBatch.songsBatch.getValue();
    return [audioPlayer.song.getValue()!, batch[0], batch[1], batch[2], batch[3]].filter(
      (s) => !!s && !!s.name,
    );
  }

  private getRecentPlays(): Promise<Song[]> {
    if (accountService.isSignedIn) {
      return songApi.getRecentPlays(3);
    }
    // Not signed in? Use whatever we have locally for recent.
    return Promise.resolve(this.recent.items);
  }

  private nextSongBeginning(song: Song | null): void {
    this.songs = this.getSongs();
    if (song) {
      // Push the previous song to the beginning of the recent songs list.
      if (this.currentSong) {
        this.recent.items.splice(0, 0, this.currentSong);
        // Keep the list distinct and capped at 3.
        const seen = new Set<string>();
        this.recent.items = this.recent.items.filter((s) => {
          if (seen.has(s.id)) {
            return false;
          }
          seen.add(s.id);
          return true;
        });
        if (this.recent.items.length > 3) {
          this.recent.items.length = 3;
        }
        this.recent.cache();
        this.recent.changed.next();
      }
      this.currentSong = song;
    }
  }

  private pauseOverlayClicked(): void {
    if (this.currentSong && this.paused) {
      audioPlayer.resume();
    }
  }

  private songClicked(song: Song): void {
    if (song !== this.currentSong) {
      song.setSolePickReason(SongPick.YouRequestedSong);
      songBatch.playQueuedSong(song);
    }
  }

  private playSongFromCurrentArtist(): void {
    if (this.currentSong?.artistId) {
      audioPlayer.playSongFromArtistId(this.currentSong.artistId);
    }
  }

  private playSongFromCurrentAlbum(): void {
    if (this.currentSong?.albumId) {
      audioPlayer.playSongFromAlbumId(this.currentSong.albumId);
    }
  }

  private playSongWithTag(tag: string): void {
    audioPlayer.playSongWithTag(tag);
  }

  private playSongInUrlQuery(): boolean {
    const params = new URLSearchParams(window.location.search);
    const songId = params.get("song");
    if (songId) {
      audioPlayer.playSongById(songId);
      return true;
    }
    const artist = params.get("artist");
    const album = params.get("album");
    if (artist && album) {
      audioPlayer.playSongFromArtistAndAlbum(artist, album);
      return true;
    }
    if (album) {
      audioPlayer.playSongFromAlbum(album);
      return true;
    }
    if (artist) {
      audioPlayer.playSongFromArtist(artist);
      return true;
    }
    return false;
  }

  private renderCurrentSongDetails() {
    const song = this.currentSong;
    if (!song) {
      return nothing;
    }
    const darker = song.albumSwatchDarker;
    return html`
      <h1 class="current-song-name" style=${`color: ${darker};`}>${song.name}</h1>
      ${song.hebrewName
        ? html`<h1 class="current-song-name hebrew" lang="he" style=${`color: ${darker};`}>${song.hebrewName}</h1>`
        : nothing}

      <div class="text-center">
        <wa-tooltip for="np-artist">Tap to play another ${song.artist} song</wa-tooltip>
        <wa-button id="np-artist" appearance="plain" class="current-song-artist" @click=${() => this.playSongFromCurrentArtist()}>
          <h4 style=${`color: ${darker};`}>${song.artist}</h4>
        </wa-button>
      </div>

      ${song.contributingArtists && song.contributingArtists.length
        ? html`<div class="text-center"><h4 style=${`color: ${darker};`}>Featuring ${song.contributingArtists.join(", ")}</h4></div>`
        : nothing}

      <div class="text-center">
        <wa-tooltip for="np-album">Tap to play another song from ${song.album}</wa-tooltip>
        <wa-button id="np-album" appearance="plain" class="current-song-album" @click=${() => this.playSongFromCurrentAlbum()}>
          <h4 style=${`color: ${darker};`}>${song.album}</h4>
          ${song.albumHebrewName
            ? html`<h4 class="hebrew" lang="he" style=${`color: ${darker};`}>${song.albumHebrewName}</h4>`
            : nothing}
        </wa-button>
      </div>

      <br />

      <wa-details
        class="rank-expander"
        summary=${`Ranked ${song.communityRankText}, ${song.communityRankStandingText}`}
        style=${`--wa-color-surface-raised: ${song.albumColors.background}; color: ${song.albumColors.foreground};`}
      >
        ${song.name} has been played ${song.totalPlays} times. It appears as the ${song.nthSongText} song on
        ${song.artist}'s ${song.album} album. Its ${song.communityRankText} ranking puts it at
        ${song.communityRankStandingText} standing of all the songs on Chavah. You can increase the rank by
        thumbing up this song. Songs with higher rank are more likely to play for everyone listening.
      </wa-details>

      <div class="text-center tags">
        ${(song.tags ?? []).map(
          (tag) => html`
            <wa-tooltip for=${`tag-${tag}`}>Tap to play another ${tag} song</wa-tooltip>
            <h4
              id=${`tag-${tag}`}
              class="tag"
              role="button"
              @click=${() => this.playSongWithTag(tag)}
              style=${`background-color: ${song.albumColors.background}; color: ${song.albumColors.foreground};`}
            >
              <wa-icon name="tag"></wa-icon> ${tag}
            </h4>
          `,
        )}
        ${song.tags && song.tags.length >= 1
          ? html`
              <wa-tooltip for="edit-tags">Add or change the tags for this song</wa-tooltip>
              <a id="edit-tags" class="edit-tags-btn" href=${`/edit/${song.id}`} aria-label="Edit tags for this song">
                <wa-icon name="tags" style=${`color: ${song.albumSwatchDarker};`}></wa-icon>
              </a>
            `
          : html`
              <h4>
                <a class="submit-lyrics" href=${`/edit/${song.id}`} style=${`color: ${song.albumSwatchDarker};`}>
                  <wa-icon name="tags"></wa-icon> Submit tags for this song
                </a>
              </h4>
            `}
      </div>

      <div>
        <h4 class="text-center" style=${`color: ${darker};`}>
          <wa-icon name="circle-info"></wa-icon>
          We're playing this song for you because ${song.reasonPlayedText}.
        </h4>
      </div>
    `;
  }

  render() {
    const current = this.currentSong;
    const darker = current?.albumSwatchDarker ?? "inherit";
    return html`
      <style>
        now-playing-page .now-playing-page {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        now-playing-page .left-pane {
          flex: 0 0 25%;
          min-width: 0;
          padding: 20px;
        }
        now-playing-page .right-pane {
          flex: 0 0 25%;
          min-width: 0;
          padding: 20px;
        }
        now-playing-page .left-pane > .list-block,
        now-playing-page .right-pane > .list-block {
          margin-bottom: 30px;
        }
        now-playing-page .center-pane {
          flex: 1 1 auto;
          min-width: 0;
        }
        now-playing-page .text-center {
          text-align: center;
        }
        now-playing-page .song-list-title {
          text-transform: lowercase;
          text-align: center;
          padding: 10px;
        }
        now-playing-page .song-list-title a {
          text-decoration: none;
        }
        @media (max-width: 767px) {
          now-playing-page .left-pane,
          now-playing-page .right-pane {
            display: none;
          }
        }
        now-playing-page .songs-container {
          width: 50%;
          margin: auto;
          height: 415px;
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
        @media (max-width: 767px) {
          now-playing-page .songs-container {
            height: 290px;
            width: 75%;
            margin-top: 0;
          }
        }
        now-playing-page .song {
          min-width: 350px;
          display: inline-block;
          background-color: white;
          padding: 5px;
          box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.5);
          transition: all ease-in-out 0.2s;
          position: absolute;
          transform-style: preserve-3d;
          perspective: 50em;
          cursor: pointer;
        }
        now-playing-page .song:nth-child(1) {
          z-index: 5;
        }
        now-playing-page .song:nth-child(2) {
          z-index: 4;
          transform: scale(0.9) translateX(-50px) translateY(-5px) rotateZ(-10deg);
          opacity: 0.9;
        }
        now-playing-page .song:nth-child(2):hover {
          transform: translateX(-120px) rotateZ(-4deg);
        }
        now-playing-page .song:nth-child(3) {
          z-index: 3;
          transform: scale(0.8) translateX(-100px) rotateZ(-15deg);
          opacity: 0.7;
        }
        now-playing-page .song:nth-child(3):hover {
          transform: translateX(-150px) rotateZ(-10deg);
        }
        now-playing-page .song:nth-child(4) {
          z-index: 2;
          transform: scale(0.7) translateX(-160px) rotateZ(-22deg);
          opacity: 0.5;
        }
        now-playing-page .song:nth-child(5) {
          z-index: 1;
          transform: scale(0.6) translateX(-240px) rotateZ(-30deg);
          opacity: 0.3;
        }
        @media (max-width: 768px) {
          now-playing-page .song:nth-child(4),
          now-playing-page .song:nth-child(5) {
            display: none;
          }
        }
        now-playing-page .song:hover:not(:first-child) {
          opacity: 1;
        }
        now-playing-page .song:hover:not(:first-child) .song-info {
          display: block;
          opacity: 0.85;
        }
        now-playing-page .song img {
          width: 350px;
        }
        @media (max-width: 767px) {
          now-playing-page .song img {
            width: 250px;
          }
        }
        now-playing-page .song .song-info {
          position: absolute;
          bottom: 0;
          padding: 5px 5px 5px 5px;
          transition: all 0.2s linear;
          opacity: 0;
          padding-top: 10px;
          width: 100%;
          white-space: normal;
          box-sizing: border-box;
        }
        now-playing-page .song .pause-overlay {
          position: absolute;
          width: 350px;
          height: 350px;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          cursor: pointer;
        }
        now-playing-page .song .pause-overlay.not-paused {
          display: none;
        }
        @media (max-width: 767px) {
          now-playing-page .song .pause-overlay {
            width: 250px;
            height: 250px;
          }
        }
        now-playing-page .current-song-name {
          margin-top: 0;
          text-align: center;
        }
        now-playing-page .current-song-artist,
        now-playing-page .current-song-album {
          cursor: pointer;
        }
        now-playing-page .current-song-artist h4,
        now-playing-page .current-song-album h4 {
          display: inline-block;
          margin: 5px;
          text-wrap: balance;
        }
        now-playing-page .rank-expander {
          opacity: 0.9;
          margin-bottom: 15px;
        }
        now-playing-page .tag {
          padding: 10px;
          margin-right: 10px;
          margin-bottom: 0;
          display: inline-block;
          cursor: pointer;
          border-radius: 3px;
        }
        now-playing-page .edit-tags-btn {
          font-size: 1.5em;
        }
      </style>
      <section class="page now-playing-page">
        <div class="left-pane">
          <div class="list-block">
            <h4 class="song-list-title">
              <a href="/trending"><span style=${`color: ${darker};`}><wa-icon name="chart-line"></wa-icon> Trending</span></a>
            </h4>
            <song-list .songs=${this.trending}></song-list>
          </div>
          ${this.newSongs.items.length
            ? html`
                <div class="list-block">
                  <h4 class="song-list-title">
                    <span style=${`color: ${darker};`}><wa-icon name="asterisk"></wa-icon> New music</span>
                  </h4>
                  <song-list .songs=${this.newSongs}></song-list>
                </div>
              `
            : nothing}
          ${this.likes.items.length
            ? html`
                <div class="list-block">
                  <h4 class="song-list-title">
                    <a href="/mylikes"><span style=${`color: ${darker};`}><wa-icon name="thumbs-up"></wa-icon> My likes</span></a>
                  </h4>
                  <song-list .songs=${this.likes}></song-list>
                </div>
              `
            : nothing}
        </div>

        <div class="center-pane">
          <div class="songs-container">
            ${this.songs.map(
              (song, index) => html`
                <div
                  class="song"
                  style=${`background-color: ${song.albumColors.background}; color: ${song.albumColors.foreground};`}
                  @click=${() => this.songClicked(song)}
                >
                  ${index === 0
                    ? html`
                        <div
                          class=${`pause-overlay ${this.isCurrentSongPaused ? "" : "not-paused"}`}
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            this.pauseOverlayClicked();
                          }}
                          title="Song is paused, tap to play"
                        >
                          <wa-icon name="play" style="font-size: 4em;"></wa-icon>
                        </div>
                      `
                    : nothing}
                  <img src=${song.albumArtUri} alt=${`Album art for ${song.artist} - ${song.album}`} />
                  <div
                    class="song-info"
                    style=${`text-shadow: 0 0 5px ${song.albumColors.textShadow}; background-color: ${song.albumColors.background};`}
                  >
                    ${song.name}<br />
                    <span style=${`color: ${song.albumColors.muted};`}>By</span> ${song.artist}<br />
                    <span style=${`color: ${song.albumColors.muted};`}>on</span> ${song.album}
                  </div>
                </div>
              `,
            )}
          </div>

          ${this.renderCurrentSongDetails()}
        </div>

        <div class="right-pane">
          ${this.recent.items.length
            ? html`
                <div class="list-block">
                  <h4 class="song-list-title">
                    <a href="/recent"><span style=${`color: ${darker};`}><wa-icon name="backward-step"></wa-icon> Recent</span></a>
                  </h4>
                  <song-list .songs=${this.recent} .refreshInterval=${-1}></song-list>
                </div>
              `
            : nothing}
          <div class="list-block">
            <h4 class="song-list-title">
              <a href="/popular"><span style=${`color: ${darker};`}><wa-icon name="star"></wa-icon> Popular</span></a>
            </h4>
            <song-list .songs=${this.popular}></song-list>
          </div>
          ${this.recentSongRequests.items.length
            ? html`
                <div class="list-block">
                  <h4 class="song-list-title">
                    <span style=${`color: ${darker};`}><wa-icon name="comment"></wa-icon> Requests</span>
                  </h4>
                  <song-list .songs=${this.recentSongRequests} .refreshInterval=${120000}></song-list>
                </div>
              `
            : nothing}
        </div>
      </section>
    `;
  }
}
