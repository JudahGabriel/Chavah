import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { audioPlayer } from "../services/audio-player-service";
import { sharing } from "../services/sharing-service";
import { Song } from "../models/song";
import { SongPick } from "../models/song-pick";
import type { PagedList } from "../shared/paged-list";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

/**
 * A paged, 3D-fanned deck of song cards with per-song share links and a
 * "Show more" pager. Used on the My Likes, Trending, and Popular pages. Ported
 * from `views/SongDeck.html` + `SongDeckController.ts` + `css/app/SongDeck.less`.
 */
@customElement("song-deck")
export class SongDeckElement extends LitElement {
  // Light DOM so the ported styles and global.css apply normally.
  createRenderRoot() {
    return this;
  }

  /** The paged collection of songs to display. */
  @property({ attribute: false }) songs: PagedList<Song> | null = null;

  /** Whether to show the "Showing X of Y / Show more" pager footer. */
  @property({ type: Boolean }) showLoadMore = false;

  private readonly canNativeShare = sharing.canNativeShare;
  private unsubscribe: () => void = () => {};

  connectedCallback(): void {
    super.connectedCallback();
    const songs = this.songs;
    if (!songs) {
      return;
    }
    this.unsubscribe = songs.changed.subscribe(() => this.requestUpdate());
    // If we rehydrated some songs from cache, no need to fetch.
    if (songs.items.length === 0) {
      songs.fetchNextChunk();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe();
  }

  private playSong(song: Song): void {
    const clone = new Song(song);
    clone.setSolePickReason(SongPick.YouRequestedSong);
    audioPlayer.playNewSong(clone);
  }

  private openShare(url: string): void {
    window.open(url, "_blank", "noopener");
  }

  private renderShareLinks(song: Song) {
    const fg = song.albumColors.foreground || "inherit";
    return html`
      <div class="share-links">
        <wa-tooltip for=${`play-${song.clientId}`}>Play this song</wa-tooltip>
        <wa-button
          id=${`play-${song.clientId}`}
          appearance="plain"
          size="small"
          style=${`color: ${fg};`}
          @click=${() => this.playSong(song)}
        >
          <wa-icon name="play" label="Play"></wa-icon>
        </wa-button>

        ${this.canNativeShare
          ? html`
              <wa-tooltip for=${`share-${song.clientId}`}>Share this song</wa-tooltip>
              <wa-button
                id=${`share-${song.clientId}`}
                appearance="plain"
                size="small"
                style=${`color: ${fg};`}
                @click=${() => sharing.nativeShare(song)}
              >
                <wa-icon name="share" label="Share"></wa-icon>
              </wa-button>
            `
          : html`
              <wa-dropdown class="dropup">
                <wa-button slot="trigger" appearance="plain" size="small" style=${`color: ${fg};`}>
                  <wa-icon name="share" label="Share this song"></wa-icon>
                </wa-button>
                <wa-dropdown-item @click=${() => this.openShare(sharing.facebookShareUrl(song))}>
                  <wa-icon slot="icon" name="facebook" family="brands" style="color: rgb(59, 88, 152);"></wa-icon>
                  Post song to Facebook
                </wa-dropdown-item>
                <wa-dropdown-item @click=${() => this.openShare(sharing.twitterShareUrl(song))}>
                  <wa-icon slot="icon" name="twitter" family="brands" style="color: rgb(85, 172, 238);"></wa-icon>
                  Tweet this song
                </wa-dropdown-item>
                <wa-dropdown-item @click=${() => this.openShare(sharing.smsShareUrl(song))}>
                  <wa-icon slot="icon" name="comment" style="color: #1cdd20;"></wa-icon>
                  Send song via text
                </wa-dropdown-item>
                <wa-dropdown-item @click=${() => this.openShare(sharing.whatsAppShareUrl(song))}>
                  <wa-icon slot="icon" name="whatsapp" family="brands" style="color: #1ebea5;"></wa-icon>
                  Send song to WhatsApp
                </wa-dropdown-item>
              </wa-dropdown>
            `}

        <wa-tooltip for=${`link-${song.clientId}`}>Get the link to this song</wa-tooltip>
        <a id=${`link-${song.clientId}`} href=${song.url} style=${`color: ${fg};`}>
          <wa-icon name="link" label="Link"></wa-icon>
        </a>
      </div>
    `;
  }

  render() {
    const songs = this.songs;
    const items = songs?.items ?? [];
    return html`
      <style>
        song-deck .song-deck {
          margin-right: 75px;
        }
        @media (max-width: 767px) {
          song-deck .song-deck {
            margin-left: 10px;
          }
        }
        song-deck .songs-container {
          width: 100%;
          perspective: 10000px;
          perspective-origin: top;
        }
        song-deck .song-item {
          padding: 10px;
          display: inline-block;
          margin: 15px -200px 0 0;
          cursor: pointer;
          box-shadow: 0 10px 15px 0 rgba(0, 0, 0, 0.4);
          transform: rotateY(15deg) skewY(-2deg);
          transition: all 0.2s ease-out;
          position: relative;
          opacity: 0.9;
          vertical-align: top;
        }
        song-deck .song-item:hover {
          transform: rotateY(0deg) scale(1.1) translate3d(5px, 0, 1px);
          z-index: 2;
          opacity: 1;
        }
        song-deck .song-item:hover .song-info .share-links {
          opacity: 1;
        }
        @media (max-width: 767px) {
          song-deck .song-item {
            margin: 15px -100px 0 0;
          }
          song-deck .song-item:hover {
            margin: 15px -50px 0 -50px;
            left: 20px;
          }
        }
        song-deck .song-item img {
          max-width: 300px;
          height: auto;
          display: block;
        }
        @media (max-width: 767px) {
          song-deck .song-item img {
            max-width: 150px;
          }
        }
        song-deck .song-item .song-info {
          margin-top: 5px;
          max-width: 300px;
        }
        @media (max-width: 767px) {
          song-deck .song-item .song-info {
            max-width: 150px;
          }
        }
        song-deck .song-item .song-info .song-info-text {
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
        song-deck .song-item .song-info .share-links {
          font-size: 1.4em;
          opacity: 0.1;
          transition: all 0.2s ease-in;
        }
        song-deck .song-item .song-info .share-links wa-button::part(base) {
          padding: 0 4px;
        }
        song-deck .song-item .text-muted {
          opacity: 0.75;
        }
        song-deck .deck-pager {
          text-align: center;
        }
      </style>
      <section class="song-deck">
        <div class="songs-container">
          ${items.map(
            (song) => html`
              <div class="song-item" style=${`background-color: ${song.albumColors.background};`}>
                <img src=${song.albumArtUri} alt=${`${song.album} album art`} />
                <div
                  class="song-info"
                  style=${`background-color: ${song.albumColors.background}; color: ${song.albumColors.foreground};`}
                >
                  <span class="song-info-text">${song.name}</span><br />
                  <span class="song-info-text">
                    <span class="text-muted" style=${`color: ${song.albumColors.muted};`}>By</span>
                    ${song.artist}
                  </span><br />
                  <span class="song-info-text">
                    <span class="text-muted" style=${`color: ${song.albumColors.muted};`}>On</span>
                    ${song.album}
                  </span><br />
                  <span class="song-info-text">
                    <span class="text-muted" style=${`color: ${song.albumColors.muted};`}>Ranked</span>
                    ${song.communityRank > 0 ? "+" : ""}${song.communityRank} ${song.communityRankStandingText}
                  </span><br />
                  ${this.renderShareLinks(song)}
                </div>
              </div>
            `,
          )}

          ${songs?.isLoading
            ? html`<h4><br /><wa-spinner></wa-spinner> <span>Loading...</span></h4>`
            : nothing}
          ${this.showLoadMore && songs?.isLoadedWithData
            ? html`
                <h4 class="deck-pager">
                  <br />
                  Showing ${items.length} of ${songs.itemsTotalCount} songs
                  <br /><br />
                  ${songs.hasMoreItems
                    ? html`<wa-button @click=${() => songs.fetchNextChunk()}>Show more</wa-button>`
                    : nothing}
                </h4>
              `
            : nothing}
        </div>
      </section>
    `;
  }
}
