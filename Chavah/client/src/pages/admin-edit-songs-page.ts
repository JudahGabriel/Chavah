import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { Song } from "../models/song";
import { songApi } from "../services/song-api-service";
import { appNav } from "../services/app-nav-service";
import type { PagedList, Song as ServerSong } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

@customElement("admin-edit-songs-page")
export class AdminEditSongsPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private songs: ServerSong[] = [];
  @state() private total = 0;
  @state() private search = "";
  @state() private isLoading = false;
  @state() private isSaving = false;
  @state() private errorMessage = "";

  private readonly take = 50;

  firstUpdated(): void {
    void this.loadSongs(true);
  }

  private async loadSongs(reset: boolean): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    try {
      const page = await songApi.getSongsAdmin(reset ? 0 : this.songs.length, this.take, this.search);
      this.applyPage(page, reset);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private applyPage(page: PagedList<ServerSong>, reset: boolean): void {
    this.total = page.total;
    this.songs = reset ? page.items : [...this.songs, ...page.items];
  }

  private searchChanged(e: Event): void {
    this.search = (e.target as HTMLInputElement).value;
    void this.loadSongs(true);
  }

  private async deleteSong(song: ServerSong): Promise<void> {
    if (this.isSaving || !confirm(`Delete "${song.name}" by ${song.artist}?`)) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = "";
    try {
      await songApi.deleteSong(new Song(song));
      this.songs = this.songs.filter((item) => item !== song);
      this.total = Math.max(this.total - 1, 0);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isSaving = false;
    }
  }

  private get hasMore(): boolean {
    return this.songs.length < this.total;
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  render() {
    return html`
      <section class="songs-page admin-page">
        <div class="admin-layout">
          <admin-sidebar active="songs"></admin-sidebar>
          <div>
            <div class="toolbar">
              <wa-input
                type="search"
                placeholder="Search for song"
                .value=${this.search}
                @input=${(e: Event) => this.searchChanged(e)}
              >
                <wa-icon slot="start" name="magnifying-glass"></wa-icon>
              </wa-input>
            </div>

            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}

            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th style="width: 35%;">Name</th>
                    <th style="width: 20%;">Artist</th>
                    <th style="width: 20%;">Album</th>
                    <th style="width: 10%;">Rank</th>
                    <th style="width: 15%;">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.songs.map(
                    (song) => html`
                      <tr>
                        <td>${song.name}</td>
                        <td>${song.artist}</td>
                        <td>${song.album}</td>
                        <td>${song.communityRank}</td>
                        <td style="text-align: right;">
                          <wa-button href=${appNav.getEditSongUrl(song.id)} title="Edit this song">
                            <wa-icon name="pen"></wa-icon>
                          </wa-button>
                          <wa-button variant="danger" title="Delete this song" ?disabled=${this.isSaving} @click=${() => this.deleteSong(song)}>
                            <wa-icon name="trash"></wa-icon>
                          </wa-button>
                        </td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
              ${this.isLoading ? html`<p class="text-center"><wa-spinner></wa-spinner> Loading songs...</p>` : nothing}
              ${!this.isLoading && !this.songs.length ? html`<p class="text-muted text-center">No songs found.</p>` : nothing}
              ${this.songs.length
                ? html`
                    <p class="text-muted text-center">
                      Showing ${this.songs.length} of ${this.total} songs
                      ${this.hasMore
                        ? html`<wa-button ?disabled=${this.isLoading} @click=${() => this.loadSongs(false)}>Load more</wa-button>`
                        : nothing}
                    </p>
                  `
                : nothing}
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
