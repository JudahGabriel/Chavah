import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { songApi } from "../services/song-api-service";
import { albumApi } from "../services/album-api-service";
import { artistApi } from "../services/artist-api-service";
import { audioPlayer } from "../services/audio-player-service";
import { PagedList } from "../shared/paged-list";
import { Song } from "../models/song";
import type { AlbumWithNetLikeCount, ArtistWithNetLikeCount } from "../models/server-interfaces";
import "../components/song-deck";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js";
import "@awesome.me/webawesome/dist/components/tab/tab.js";
import "@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js";

type LikesCategory = "Songs" | "Albums" | "Artists";

/**
 * The current user's liked songs, albums, and artists, browsable by tab with a
 * shared search box. Ported from `views/MyLikes.html` + `MyLikesController`.
 */
@customElement("my-likes-page")
export class MyLikesPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state() private searchText = "";
  @state() private activeCategory: LikesCategory = "Songs";

  private songs = new PagedList<Song>((skip, take) => songApi.getLikes(skip, take, this.searchText));
  private albums = new PagedList<AlbumWithNetLikeCount>((skip, take) =>
    albumApi.getLikedAlbums(skip, take, this.searchText),
  );
  private artists = new PagedList<ArtistWithNetLikeCount>((skip, take) =>
    artistApi.getLikedArtists(skip, take, this.searchText),
  );

  private readonly allCategories: LikesCategory[] = ["Songs", "Albums", "Artists"];
  private searchDebounce = 0;
  private unsubscribes: Array<() => void> = [];

  constructor() {
    super();
    this.songs.take = 20;
    this.albums.take = 20;
    this.artists.take = 20;
  }

  connectedCallback(): void {
    super.connectedCallback();
    const rerender = () => this.requestUpdate();
    this.unsubscribes = [
      this.songs.changed.subscribe(rerender),
      this.albums.changed.subscribe(rerender),
      this.artists.changed.subscribe(rerender),
    ];
    this.songs.fetchNextChunk();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribes.forEach((u) => u());
    clearTimeout(this.searchDebounce);
  }

  private setCategory(category: LikesCategory): void {
    if (this.activeCategory !== category) {
      this.activeCategory = category;
      this.fetchItemsForCurrentView();
    }
  }

  private onSearchInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = window.setTimeout(() => {
      this.searchText = value;
      this.fetchItemsForCurrentView();
    }, 500);
  }

  private fetchItemsForCurrentView(): void {
    switch (this.activeCategory) {
      case "Songs":
        this.songs.resetAndFetch();
        break;
      case "Albums":
        this.albums.resetAndFetch();
        break;
      case "Artists":
        this.artists.resetAndFetch();
        break;
    }
  }

  private playAlbum(album: AlbumWithNetLikeCount): void {
    audioPlayer.playSongFromAlbumId(album.id);
  }

  private playArtist(artist: ArtistWithNetLikeCount): void {
    audioPlayer.playSongFromArtist(artist.name);
  }

  private renderAlbums() {
    const albums = this.albums;
    return html`
      <div class="albums-container">
        ${albums.items.map(
          (album) => html`
            <div
              class="like-card"
              @click=${() => this.playAlbum(album)}
              title="Click to play a song from this album"
              style=${`background-color: ${album.backgroundColor};`}
            >
              <img src=${album.albumArtUri ?? ""} alt=${`${album.name} album art`} />
              <div
                class="like-info"
                style=${`background-color: ${album.backgroundColor}; color: ${album.foregroundColor};`}
              >
                <h3 class="album-name">
                  ${album.name}
                  <span class="net-likes">${album.netLikeCount > 0 ? "+" : ""}${album.netLikeCount}</span>
                </h3>
                <span class="text-muted" style=${`color: ${album.mutedColor};`}>By</span> ${album.artist}
                <p>${album.likeCount} song${album.likeCount === 1 ? "" : "s"} <wa-icon name="thumbs-up"></wa-icon></p>
                <p>
                  ${album.dislikeCount} song${album.dislikeCount === 1 ? "" : "s"}
                  <wa-icon name="thumbs-down"></wa-icon>
                </p>
              </div>
            </div>
          `,
        )}
        ${this.renderListStatus(albums, "liked albums")}
      </div>
    `;
  }

  private renderArtists() {
    const artists = this.artists;
    return html`
      <div class="artists-container">
        ${artists.items.map(
          (artist) => html`
            <div
              class="artist-card"
              @click=${() => this.playArtist(artist)}
              title="Click to play a song from this artist"
            >
              <h2 class="artist-name text-center">${artist.name}</h2>
              ${artist.images.length
                ? html`<div
                    class="artist-image"
                    style=${`background-image: url('${artist.images[0]}');`}
                  ></div>`
                : html`<div class="artist-image-placeholder text-center">
                    <wa-icon name="circle-user" class="text-muted"></wa-icon>
                  </div>`}
              <h3 class="text-center">${artist.netLikeCount > 0 ? "+" : ""}${artist.netLikeCount}</h3>
              <p>${artist.likeCount} song${artist.likeCount === 1 ? "" : "s"} <wa-icon name="thumbs-up"></wa-icon></p>
              <p>
                ${artist.dislikeCount} song${artist.dislikeCount === 1 ? "" : "s"}
                <wa-icon name="thumbs-down"></wa-icon>
              </p>
            </div>
          `,
        )}
        ${this.renderListStatus(artists, "liked artists")}
      </div>
    `;
  }

  private renderListStatus<T>(list: PagedList<T>, noun: string) {
    return html`
      ${list.isLoading
        ? html`<h4><br /><wa-spinner></wa-spinner> <span>Loading your ${noun}...</span></h4>`
        : nothing}
      ${list.isLoadedAndEmpty
        ? html`<h4>
            <br /><wa-icon name="circle-info"></wa-icon>
            ${this.searchText
              ? html`<span>No ${noun} matching your search.</span>`
              : html`<span
                  >You haven't liked any ${noun.replace("liked ", "")} yet. Click the
                  <wa-icon name="thumbs-up"></wa-icon> button to like a song.</span
                >`}
          </h4>`
        : nothing}
      ${list.isLoadedWithData
        ? html`<h4 class="text-center">
            <br />Showing ${list.items.length} of ${list.itemsTotalCount} ${noun}<br /><br />
            ${list.hasMoreItems
              ? html`<wa-button @click=${() => list.fetchNextChunk()}>Show more</wa-button>`
              : nothing}
          </h4>`
        : nothing}
    `;
  }

  render() {
    return html`
      <style>
        my-likes-page .search-box {
          max-width: 420px;
          margin: 0 auto 1rem auto;
        }
        my-likes-page .albums-container,
        my-likes-page .artists-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 15px;
        }
        my-likes-page .like-card,
        my-likes-page .artist-card {
          cursor: pointer;
          width: 220px;
          box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease-out;
          position: relative;
        }
        my-likes-page .like-card:hover,
        my-likes-page .artist-card:hover {
          transform: scale(1.05);
          z-index: 2;
        }
        my-likes-page .like-card img {
          width: 100%;
          display: block;
        }
        my-likes-page .like-info,
        my-likes-page .artist-card {
          padding: 8px;
          box-sizing: border-box;
        }
        my-likes-page .album-name {
          font-size: 1rem;
          margin: 0;
        }
        my-likes-page .net-likes {
          float: right;
        }
        my-likes-page .artist-card {
          background-color: var(--wa-color-neutral-fill-quiet);
        }
        my-likes-page .artist-image {
          width: 100%;
          height: 150px;
          background-size: cover;
          background-position: center;
        }
        my-likes-page .artist-image-placeholder wa-icon {
          font-size: 4rem;
        }
        my-likes-page .text-muted {
          opacity: 0.75;
        }
      </style>
      <section class="page my-likes-page">
        <h2 class="page-title">My Likes</h2>

        <div class="search-box">
          <wa-input
            placeholder="Type a song, artist, or album"
            @input=${(e: Event) => this.onSearchInput(e)}
          >
            <wa-icon slot="start" name="magnifying-glass"></wa-icon>
          </wa-input>
        </div>

        <wa-tab-group @wa-tab-show=${(e: CustomEvent) => this.setCategory((e.detail as { name: string }).name as LikesCategory)}>
          ${this.allCategories.map(
            (category) => html`<wa-tab slot="nav" panel=${category}>${category}</wa-tab>`,
          )}

          <wa-tab-panel name="Songs">
            <song-deck .songs=${this.songs} .showLoadMore=${true}></song-deck>
          </wa-tab-panel>
          <wa-tab-panel name="Albums">${this.renderAlbums()}</wa-tab-panel>
          <wa-tab-panel name="Artists">${this.renderArtists()}</wa-tab-panel>
        </wa-tab-group>
      </section>
    `;
  }
}
