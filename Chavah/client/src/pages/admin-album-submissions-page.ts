import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { albumApi } from "../services/album-api-service";
import type { AlbumSubmissionByArtist, TempFile } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/card/card.js";

@customElement("admin-album-submissions-page")
export class AdminAlbumSubmissionsPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private currentAlbum: AlbumSubmissionByArtist | null = null;
  @state() private submissions: AlbumSubmissionByArtist[] = [];
  @state() private hasLoaded = false;
  @state() private isSaving = false;
  @state() private errorMessage = "";

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadSubmissions();
  }

  private async loadSubmissions(): Promise<void> {
    this.hasLoaded = false;
    this.errorMessage = "";
    try {
      this.submissions = await albumApi.getSubmissions();
      this.currentAlbum = this.submissions[0] ?? null;
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.hasLoaded = true;
    }
  }

  private setCurrentAlbum(album: AlbumSubmissionByArtist | null): void {
    this.currentAlbum = album;
  }

  private moveSongUp(song: TempFile): void {
    if (!this.currentAlbum) {
      return;
    }
    const songIndex = this.currentAlbum.songs.indexOf(song);
    if (songIndex > 0) {
      const songs = [...this.currentAlbum.songs];
      [songs[songIndex - 1], songs[songIndex]] = [songs[songIndex], songs[songIndex - 1]];
      this.updateCurrentAlbum({ ...this.currentAlbum, songs });
    }
  }

  private moveSongDown(song: TempFile): void {
    if (!this.currentAlbum) {
      return;
    }
    const songIndex = this.currentAlbum.songs.indexOf(song);
    if (songIndex !== -1 && songIndex < this.currentAlbum.songs.length - 1) {
      const songs = [...this.currentAlbum.songs];
      [songs[songIndex + 1], songs[songIndex]] = [songs[songIndex], songs[songIndex + 1]];
      this.updateCurrentAlbum({ ...this.currentAlbum, songs });
    }
  }

  private removeSong(song: TempFile): void {
    if (!this.currentAlbum) {
      return;
    }
    this.updateCurrentAlbum({ ...this.currentAlbum, songs: this.currentAlbum.songs.filter((s) => s !== song) });
  }

  private renameSong(song: TempFile, name: string): void {
    if (!this.currentAlbum) {
      return;
    }
    const songs = this.currentAlbum.songs.map((s) => (s === song ? { ...s, name } : s));
    this.updateCurrentAlbum({ ...this.currentAlbum, songs });
  }

  private updateCurrentAlbum(album: AlbumSubmissionByArtist): void {
    this.currentAlbum = album;
    this.submissions = this.submissions.map((submission) => (submission === this.currentAlbum || submission.name === album.name && submission.artist === album.artist ? album : submission));
  }

  private removeSubmissionFromList(album: AlbumSubmissionByArtist): void {
    this.submissions = this.submissions.filter((submission) => submission !== album);
    this.setCurrentAlbum(this.submissions[0] ?? null);
    document.querySelector(".submissions-list")?.scrollIntoView({ behavior: "smooth" });
  }

  private async approve(): Promise<void> {
    const album = this.currentAlbum;
    if (this.isSaving || !album) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = "";
    try {
      await albumApi.approveAlbumSubmission(album);
      this.removeSubmissionFromList(album);
    } catch (error) {
      this.errorMessage = `Failed to approve album submission: ${this.formatError(error)}`;
    } finally {
      this.isSaving = false;
    }
  }

  private async reject(): Promise<void> {
    const album = this.currentAlbum;
    if (this.isSaving || !album || !confirm(`Reject ${album.artist} - ${album.name}?`)) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = "";
    try {
      await albumApi.rejectAlbumSubmission(album);
      this.removeSubmissionFromList(album);
    } catch (error) {
      this.errorMessage = `Failed to reject album submission: ${this.formatError(error)}`;
    } finally {
      this.isSaving = false;
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private renderAlbumPreview(album: AlbumSubmissionByArtist) {
    return html`
      <wa-card style=${`--background-color: ${album.backColor}; color: ${album.foreColor};`}>
        ${album.albumArt?.url ? html`<img slot="image" src=${album.albumArt.url} alt=${`${album.name} album art`} />` : nothing}
        <h3>${album.name}</h3>
        <p style=${`color: ${album.mutedColor}; text-shadow: 0 1px ${album.textShadowColor};`}>${album.artist}</p>
        <p><strong>Genres:</strong> ${album.genres || "N/A"}</p>
        <p><strong>Purchase URL:</strong> ${album.purchaseUrl ? html`<a href=${album.purchaseUrl}>${album.purchaseUrl}</a>` : "N/A"}</p>
        <p><strong>PayPal email:</strong> ${album.artistPayPalEmail || "N/A"}</p>
      </wa-card>
    `;
  }

  private renderCurrentAlbum() {
    const album = this.currentAlbum;
    if (!album) {
      return nothing;
    }

    return html`
      <h3>${album.artist} - ${album.name}</h3>
      <h5>Submitted by ${album.artistEmail}</h5>
      ${this.renderAlbumPreview(album)}
      <div class="songs-container d-flex flex-column">
        <h3>Song list</h3>
        ${album.songs.map(
          (song, index) => html`
            <div class="song-container d-flex">
              <h4>${index + 1}.</h4>
              <div>
                <wa-input type="text" .value=${song.name} @input=${(e: Event) => this.renameSong(song, (e.target as HTMLInputElement).value)}></wa-input>
                <audio controls src=${song.url}></audio>
              </div>
              <wa-button title="Move up" @click=${() => this.moveSongUp(song)} ?disabled=${index === 0}><wa-icon name="arrow-up"></wa-icon></wa-button>
              <wa-button title="Move down" @click=${() => this.moveSongDown(song)} ?disabled=${index === album.songs.length - 1}><wa-icon name="arrow-down"></wa-icon></wa-button>
              <wa-button variant="danger" title="Remove the song" @click=${() => this.removeSong(song)}><wa-icon name="trash"></wa-icon></wa-button>
            </div>
          `,
        )}
      </div>
      <div class="footer-buttons d-flex">
        <wa-button variant="success" ?disabled=${this.isSaving} @click=${() => this.approve()}>
          <wa-icon slot="start" name="check"></wa-icon>Approve
        </wa-button>
        <wa-button variant="danger" ?disabled=${this.isSaving} @click=${() => this.reject()}>
          <wa-icon slot="start" name="trash"></wa-icon>Reject
        </wa-button>
        ${this.isSaving ? html`<wa-spinner></wa-spinner>` : nothing}
      </div>
    `;
  }

  render() {
    return html`
      <section class="admin-album-submissions-page admin-page">
        <div class="admin-layout">
          <admin-sidebar active="album-submissions"></admin-sidebar>
          <div>
            ${!this.hasLoaded ? html`<h4><wa-spinner></wa-spinner> Loading album submissions...</h4>` : nothing}
            ${this.hasLoaded && this.submissions.length === 0
              ? html`<h3 class="text-center"><wa-icon name="circle-info"></wa-icon> No pending album submissions</h3>`
              : nothing}
            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            ${this.submissions.length
              ? html`
                  <div class="row submissions-list-container">
                    <div class="col-xs-12 col-sm-3">
                      <div class="list-group submissions-list">
                        ${this.submissions.map(
                          (album) => html`
                            <a href="javascript:void(0)" class=${`list-group-item ${this.currentAlbum === album ? "active" : ""}`} @click=${() => this.setCurrentAlbum(album)}>
                              ${album.artist} - ${album.name}
                            </a>
                          `,
                        )}
                      </div>
                    </div>
                    <div class="col-xs-12 col-sm-9">${this.renderCurrentAlbum()}</div>
                  </div>
                `
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
