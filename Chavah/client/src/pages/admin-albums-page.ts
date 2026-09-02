import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { Album } from "../models/album";
import { albumApi } from "../services/album-api-service";
import { appNav } from "../services/app-nav-service";
import type { PagedList } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

@customElement("admin-albums-page")
export class AdminAlbumsPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private albums: Album[] = [];
  @state() private total = 0;
  @state() private search = "";
  @state() private isLoading = false;
  @state() private isSaving = false;
  @state() private errorMessage = "";

  private readonly take = 50;

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadAlbums(true);
  }

  private async loadAlbums(reset: boolean): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    try {
      const page = await albumApi.getAll(reset ? 0 : this.albums.length, this.take, this.search);
      this.applyPage(page, reset);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private applyPage(page: PagedList<Album>, reset: boolean): void {
    this.total = page.total;
    this.albums = reset ? page.items : [...this.albums, ...page.items];
  }

  private searchChanged(e: Event): void {
    this.search = (e.target as HTMLInputElement).value;
    void this.loadAlbums(true);
  }

  private async deleteAlbum(album: Album): Promise<void> {
    if (this.isSaving || !confirm(`Delete "${album.name}" by ${album.artist}?`)) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = "";
    try {
      await albumApi.deleteAlbum(album.id);
      this.albums = this.albums.filter((item) => item !== album);
      this.total = Math.max(this.total - 1, 0);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isSaving = false;
    }
  }

  private get hasMore(): boolean {
    return this.albums.length < this.total;
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  render() {
    return html`
      <section class="albums-page admin-page">
        <div class="admin-layout">
          <admin-sidebar active="albums"></admin-sidebar>
          <div>
            <div class="toolbar">
              <wa-button href="/admin/album/upload" title="Upload an album with songs">
                <wa-icon slot="start" name="upload"></wa-icon>Upload album
              </wa-button>
              <wa-button variant="brand" @click=${() => appNav.createAlbum()} title="Create an album without songs">
                <wa-icon slot="start" name="plus"></wa-icon>Create album
              </wa-button>
              <wa-input
                type="search"
                placeholder="Search by album or artist"
                .value=${this.search}
                @input=${(e: Event) => this.searchChanged(e)}
              >
                <wa-icon slot="start" name="magnifying-glass"></wa-icon>
              </wa-input>
            </div>

            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            ${this.isLoading && !this.albums.length ? html`<h4><wa-spinner></wa-spinner> Loading albums...</h4>` : nothing}

            <div class="albums-container row">
              ${this.albums.map(
                (album) => html`
                  <div class="col-xs-6 col-md-4">
                    <wa-card class="thumbnail album" style=${`--background-color: ${album.backgroundColor || "white"};`}>
                      ${album.albumArtUri ? html`<img slot="image" src=${album.albumArtUri} alt=${`${album.name} album art`} />` : nothing}
                      <h3 style=${`color: ${album.foregroundColor || "inherit"};`}>
                        ${album.name} ${album.hebrewName ? html`<span>${album.hebrewName}</span>` : nothing}
                      </h3>
                      <p>
                        <span style=${`color: ${album.mutedColor || "inherit"};`}>By</span>
                        <span style=${`color: ${album.foregroundColor || "inherit"};`}>${album.artist}</span>
                      </p>
                      <p class="text-muted">${album.songCount} songs</p>
                      <wa-button title="Edit this album" @click=${() => appNav.editAlbum(album.artist, album.name)}>
                        <wa-icon slot="start" name="pen"></wa-icon>Edit
                      </wa-button>
                      <wa-button variant="danger" title="Delete this album" ?disabled=${this.isSaving} @click=${() => this.deleteAlbum(album)}>
                        <wa-icon slot="start" name="trash"></wa-icon>Delete
                      </wa-button>
                    </wa-card>
                  </div>
                `,
              )}
            </div>

            ${!this.isLoading && !this.albums.length ? html`<p class="text-muted text-center">No albums found.</p>` : nothing}
            ${this.albums.length
              ? html`
                  <p class="text-muted text-center">
                    Showing ${this.albums.length} of ${this.total} albums
                    ${this.hasMore
                      ? html`<wa-button ?disabled=${this.isLoading} @click=${() => this.loadAlbums(false)}>Load more</wa-button>`
                      : nothing}
                  </p>
                `
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
