import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { audioPlayer } from "../services/audio-player-service";
import { Song } from "../models/song";
import { SongPick } from "../models/song-pick";
import type { List } from "../shared/list";
import type { PagedList } from "../shared/paged-list";

type SongCollection = List<Song> | PagedList<Song>;

/**
 * A small fanned deck of album-art tiles, auto-refreshed periodically. Used on
 * the home page for Trending, My Likes, Recent, and Popular. Ported from
 * `views/SongList.html` + `SongListController.ts` + `css/app/songList.less`.
 */
@customElement("song-list")
export class SongListElement extends LitElement {
  // Light DOM so the ported styles and global.css apply normally.
  createRenderRoot() {
    return this;
  }

  /** The collection of songs to display (a `List` or `PagedList` of `Song`). */
  @property({ attribute: false }) songs: SongCollection | null = null;

  /** Refresh cadence in ms. -1 disables the recurring refresh. Default 60s. */
  @property({ type: Number }) refreshInterval = 60000;

  private refreshHandle: number | null = null;
  private unsubscribe: () => void = () => {};

  connectedCallback(): void {
    super.connectedCallback();
    const songs = this.songs;
    if (!songs) {
      return;
    }

    this.unsubscribe = songs.changed.subscribe(() => this.requestUpdate());

    // If we rehydrated some songs from cache, no need to fetch immediately.
    if (songs.items.length === 0) {
      // Delay the first fetch up to 5 seconds so item appearances stagger.
      setTimeout(() => this.fetchSongs(), Math.random() * 5000);
    }

    if (this.refreshInterval !== -1) {
      this.refreshHandle = window.setInterval(
        () => this.fetchSongs(),
        this.refreshInterval + Math.random() * 3000,
      );
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe();
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }

  private fetchSongs(): void {
    const songs = this.songs as any;
    if (!songs) {
      return;
    }
    if (typeof songs.fetch === "function") {
      songs.fetch();
    } else if (typeof songs.refresh === "function") {
      songs.refresh();
    }
  }

  private playSong(song: Song): void {
    // Clone the song so it gets a fresh clientId for separate tracking.
    const clone = new Song(song);
    clone.setSolePickReason(SongPick.YouRequestedSong);
    // Play by ID so we fetch the user's like status for it.
    audioPlayer.playSongById(clone.id);
  }

  render() {
    const items = this.songs?.items ?? [];
    return html`
      <style>
        song-list .song-list {
          transform-style: preserve-3d;
          white-space: nowrap;
          display: flex;
          justify-content: center;
        }
        song-list .song-item {
          cursor: pointer;
          transition: all 0.2s linear;
          margin-top: 2px;
          display: inline-block;
          opacity: 1;
          position: relative;
          transform: rotateZ(-14deg) translate3d(70px, 30px, 0);
          box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.8);
        }
        song-list .song-item:nth-child(2) {
          transform: translate3d(0, 0, 0px);
        }
        song-list .song-item:nth-child(3) {
          transform: rotateZ(14deg) translate3d(-70px, 40px, 0);
        }
        song-list .song-item .song-info {
          text-align: left;
          opacity: 0.7;
          transition: all 0.2s ease-out;
          background-color: rgba(47, 61, 88, 0.9);
          width: 100%;
          display: inline-block;
          position: absolute;
          bottom: 0px;
          left: 0;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          padding: 2px;
          box-sizing: border-box;
        }
        song-list .song-item img {
          max-width: 150px;
          max-height: 150px;
          display: block;
        }
        @media (max-width: 992px) {
          song-list .song-item img {
            max-width: 100px;
            max-height: 100px;
          }
        }
        @media (max-width: 768px) {
          song-list .song-item img {
            max-width: 75px;
            max-height: 75px;
          }
        }
        song-list .song-item:hover {
          transform: scale(1.2) translate3d(70px, 0, 1px);
          z-index: 2;
        }
        song-list .song-item:hover:nth-child(2) {
          transform: scale(1.2) translate3d(-15px, 0, 1px);
        }
        song-list .song-item:hover:nth-child(3) {
          transform: scale(1.2) translate3d(-30px, 0, 1px);
        }
        song-list .song-item:hover .song-info {
          opacity: 0.9;
        }
        song-list .song-item .text-muted {
          opacity: 0.75;
        }
      </style>
      <section class="song-list">
        ${items.length === 0
          ? nothing
          : items.map(
              (song) => html`
                <div
                  class="song-item"
                  @click=${() => this.playSong(song)}
                  title=${`${song.name} by ${song.artist} on ${song.album}`}
                >
                  <img src=${song.albumArtUri} alt=${`${song.album} album art`} />
                  <div
                    class="song-info"
                    style=${`background-color: ${song.albumColors.background || "inherit"}; color: ${song.albumColors.foreground || "inherit"};`}
                  >
                    ${song.name}<br />
                    <span class="text-muted" style=${`color: ${song.albumColors.muted};`}>By</span>
                    ${song.artist}<br />
                    <span class="text-muted" style=${`color: ${song.albumColors.muted};`}>On</span>
                    ${song.album}
                  </div>
                </div>
              `,
            )}
      </section>
    `;
  }
}
