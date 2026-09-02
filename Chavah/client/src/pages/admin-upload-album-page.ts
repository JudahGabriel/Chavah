import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { albumApi } from "../services/album-api-service";
import { appNav } from "../services/app-nav-service";
import type { AlbumUpload, TempFile } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

type UploadStatus = "queued" | "uploading" | "completed" | "failed";

interface AdminMediaUpload {
  file: File;
  name: string;
  error: string | null;
  url: string | null;
  status: UploadStatus;
  id: string | null;
  cdnId: string | null;
}

@customElement("admin-upload-album-page")
export class AdminUploadAlbumPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private albumName = "";
  @state() private artistName = "";
  @state() private albumHebrewName = "";
  @state() private purchaseUrl = "";
  @state() private genre = "";
  @state() private songs: AdminMediaUpload[] = [];
  @state() private albumArt: AdminMediaUpload | null = null;
  @state() private isSaving = false;
  @state() private uploadError = "";
  @state() private uploadSuccess = "";
  @state() private foreColor = "#000000";
  @state() private backColor = "#ffffff";
  @state() private mutedColor = "#666666";
  @state() private textShadowColor = "#000000";

  private readonly allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];

  private get isUploadingMediaFiles(): boolean {
    return this.songs.some((song) => song.status === "uploading") || this.albumArt?.status === "uploading";
  }

  private get anySongsFailedToUpload(): boolean {
    return this.songs.some((song) => song.status === "failed") || this.albumArt?.status === "failed";
  }

  private songsChosen(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const queued = files
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((file) => this.createMediaFileUpload(file));
    this.songs = [...this.songs, ...queued];
    void this.processFileUploads();
  }

  private albumArtChosen(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    const upload = this.createMediaFileUpload(file);
    this.albumArt = upload;
    void this.uploadTempFile(upload, true);
    // Vibrant.js color extraction omitted; colors are edited manually below.
  }

  private createMediaFileUpload(file: File): AdminMediaUpload {
    return {
      file,
      name: AdminUploadAlbumPage.songNameFromFileName(file.name),
      error: null,
      url: null,
      status: "queued",
      id: null,
      cdnId: null,
    };
  }

  private async processFileUploads(): Promise<void> {
    const nextQueuedSong = this.songs.find((song) => song.status === "queued");
    if (!nextQueuedSong) {
      return;
    }

    await this.uploadTempFile(nextQueuedSong, false).catch(() => undefined);
    await this.processFileUploads();
  }

  private async uploadTempFile(upload: AdminMediaUpload, isAlbumArt: boolean): Promise<void> {
    upload.status = "uploading";
    this.refreshUploads(isAlbumArt);
    try {
      const tempFile = await albumApi.uploadTempFile(upload.file);
      upload.status = "completed";
      upload.url = tempFile.url;
      upload.cdnId = tempFile.cdnId;
      upload.id = tempFile.id;
      upload.error = null;
    } catch (error) {
      upload.status = "failed";
      upload.url = null;
      upload.error = this.formatError(error);
    } finally {
      this.refreshUploads(isAlbumArt);
    }
  }

  private refreshUploads(isAlbumArt: boolean): void {
    if (isAlbumArt && this.albumArt) {
      this.albumArt = { ...this.albumArt };
    } else {
      this.songs = [...this.songs];
    }
  }

  private moveSong(song: AdminMediaUpload, direction: -1 | 1): void {
    const currentIndex = this.songs.indexOf(song);
    const newIndex = currentIndex + direction;
    if (currentIndex >= 0 && newIndex >= 0 && newIndex < this.songs.length) {
      const songs = [...this.songs];
      songs.splice(currentIndex, 1);
      songs.splice(newIndex, 0, song);
      this.songs = songs;
    }
  }

  private removeSong(song: AdminMediaUpload): void {
    this.songs = this.songs.filter((item) => item !== song);
  }

  private renameSong(song: AdminMediaUpload, name: string): void {
    song.name = name;
    this.songs = [...this.songs];
  }

  private async upload(): Promise<void> {
    this.uploadError = "";
    this.uploadSuccess = "";

    const validationError = this.validateUpload();
    if (validationError) {
      this.uploadError = validationError;
      return;
    }

    this.isSaving = true;
    try {
      const album: AlbumUpload = {
        albumArt: AdminUploadAlbumPage.mediaUploadToTempFile(this.albumArt!),
        artist: this.artistName,
        backColor: this.backColor,
        foreColor: this.foreColor,
        genres: this.genre,
        mutedColor: this.mutedColor,
        name: this.albumName,
        hebrewName: this.albumHebrewName || null,
        purchaseUrl: this.purchaseUrl,
        songs: this.songs.map(AdminUploadAlbumPage.mediaUploadToTempFile),
        textShadowColor: this.textShadowColor,
      };
      await albumApi.upload(album);
      this.uploadSuccess = "Album uploaded.";
      appNav.editAlbum(album.artist, album.name);
    } catch (error) {
      this.uploadError = this.formatError(error);
    } finally {
      this.isSaving = false;
    }
  }

  private validateUpload(): string {
    if (!this.albumArt?.url) {
      return "Must have album art.";
    }
    if (!this.albumName) {
      return "Must have album name.";
    }
    if (!this.artistName) {
      return "Must have an artist.";
    }
    if (this.isUploadingMediaFiles) {
      return "Song upload is still in progress.";
    }
    if (this.songs.some((song) => !song.url || !song.id)) {
      return "Some songs haven't finished uploading.";
    }
    return "";
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error || "Failed to upload file.");
  }

  private static songNameFromFileName(fileName: string): string {
    const withoutExtension = fileName.lastIndexOf(".") > 0 ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
    const lastIndexOfDash = withoutExtension.lastIndexOf(" - ");
    return lastIndexOfDash >= 0 ? withoutExtension.substring(lastIndexOfDash + 3) : withoutExtension;
  }

  private static mediaUploadToTempFile(file: AdminMediaUpload): TempFile {
    if (!file.id || !file.url) {
      throw new Error(`Media file ${file.name} hasn't been uploaded.`);
    }

    return {
      name: file.name,
      url: file.url,
      id: file.id,
      cdnId: file.cdnId,
      createdAt: new Date().toISOString(),
    };
  }

  render() {
    return html`
      <section class="page upload-album-page">
        <div class="admin-layout">
          <admin-sidebar active="albums"></admin-sidebar>
          <div>
            <h2>Upload an album</h2>
            ${this.uploadError
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.uploadError}</wa-callout>`
              : nothing}
            ${this.uploadSuccess
              ? html`<wa-callout variant="success"><wa-icon slot="icon" name="check"></wa-icon>${this.uploadSuccess}</wa-callout>`
              : nothing}
            <form @submit=${(e: SubmitEvent) => { e.preventDefault(); void this.upload(); }}>
              <wa-input label="Album name" .value=${this.albumName} @input=${(e: Event) => (this.albumName = (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Hebrew name" .value=${this.albumHebrewName} @input=${(e: Event) => (this.albumHebrewName = (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Artist" .value=${this.artistName} @input=${(e: Event) => (this.artistName = (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Purchase URL" .value=${this.purchaseUrl} @input=${(e: Event) => (this.purchaseUrl = (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Genre" list="adminAlbumGenres" .value=${this.genre} @input=${(e: Event) => (this.genre = (e.target as HTMLInputElement).value)}></wa-input>
              <datalist id="adminAlbumGenres">${this.allGenres.map((genre) => html`<option value=${genre}></option>`)}</datalist>

              <div class="form-group">
                <label for="chooseAlbumArtInput"><wa-icon name="image"></wa-icon> Album art</label>
                <input id="chooseAlbumArtInput" class="form-control" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" @change=${(e: Event) => this.albumArtChosen(e)} />
                ${this.albumArt
                  ? html`<p>${this.albumArt.status === "uploading" ? html`<wa-spinner></wa-spinner>` : nothing} ${this.albumArt.name} (${this.albumArt.status})</p>`
                  : nothing}
              </div>

              <h4>Album colors</h4>
              <div class="row">
                <div class="col-sm-3"><wa-input type="color" label="Fore" .value=${this.foreColor} @input=${(e: Event) => (this.foreColor = (e.target as HTMLInputElement).value)}></wa-input></div>
                <div class="col-sm-3"><wa-input type="color" label="Background" .value=${this.backColor} @input=${(e: Event) => (this.backColor = (e.target as HTMLInputElement).value)}></wa-input></div>
                <div class="col-sm-3"><wa-input type="color" label="Muted" .value=${this.mutedColor} @input=${(e: Event) => (this.mutedColor = (e.target as HTMLInputElement).value)}></wa-input></div>
                <div class="col-sm-3"><wa-input type="color" label="Text shadow" .value=${this.textShadowColor} @input=${(e: Event) => (this.textShadowColor = (e.target as HTMLInputElement).value)}></wa-input></div>
              </div>

              <div class="form-group">
                <label for="chooseMp3sInput"><wa-icon name="music"></wa-icon> Songs</label>
                <input id="chooseMp3sInput" class="form-control" type="file" accept=".mp3,audio/mpeg" multiple @change=${(e: Event) => this.songsChosen(e)} />
              </div>

              ${this.anySongsFailedToUpload ? html`<p class="text-danger">One or more files failed to upload. Remove them or try again.</p>` : nothing}
              <div class="songs-container">
                ${this.songs.map(
                  (song, index) => html`
                    <div class="song-container">
                      <strong>${index + 1}.</strong>
                      <wa-input .value=${song.name} @input=${(e: Event) => this.renameSong(song, (e.target as HTMLInputElement).value)}></wa-input>
                      <span>${song.status}</span>
                      ${song.status === "uploading" ? html`<wa-spinner></wa-spinner>` : nothing}
                      ${song.error ? html`<span class="text-danger">${song.error}</span>` : nothing}
                      <wa-button title="Move up" ?disabled=${index === 0} @click=${() => this.moveSong(song, -1)}><wa-icon name="arrow-up"></wa-icon></wa-button>
                      <wa-button title="Move down" ?disabled=${index === this.songs.length - 1} @click=${() => this.moveSong(song, 1)}><wa-icon name="arrow-down"></wa-icon></wa-button>
                      <wa-button variant="danger" title="Remove" @click=${() => this.removeSong(song)}><wa-icon name="trash"></wa-icon></wa-button>
                    </div>
                  `,
                )}
              </div>

              <wa-button type="submit" variant="brand" ?disabled=${this.isSaving || this.isUploadingMediaFiles}>
                ${this.isSaving ? html`<wa-spinner></wa-spinner> Saving...` : html`<wa-icon slot="start" name="upload"></wa-icon>Upload`}
              </wa-button>
            </form>
          </div>
        </div>
      </section>
    `;
  }
}
