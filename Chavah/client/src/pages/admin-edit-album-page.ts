import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { Album } from "../models/album";
import { albumApi } from "../services/album-api-service";
import { appNav } from "../services/app-nav-service";
import type { Song as ServerSong } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

interface EditableAlbum extends Album {
  songs?: ServerSong[];
}

@customElement("admin-edit-album-page")
export class AdminEditAlbumPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private album: EditableAlbum | null = null;
  @state() private isLoading = false;
  @state() private errorMessage = "";
  @state() private successMessage = "";
  @state() private hasChangedAlbumArt = false;

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadAlbum();
  }

  private async loadAlbum(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      const artist = this.params.artist;
      const album = this.params.album;
      if (artist && album && artist.toLowerCase() === "albums") {
        this.albumLoaded(await albumApi.get(album));
      } else if (artist && album) {
        this.albumLoaded(await albumApi.getByArtistAndAlbumName(artist, album));
      } else {
        this.album = this.createNewAlbum();
      }
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private createNewAlbum(): EditableAlbum {
    const album = new Album({
      albumArtUri: "",
      artist: "[new artist]",
      isVariousArtists: false,
      backgroundColor: "",
      foregroundColor: "",
      mutedColor: "",
      name: "[new album]",
      id: "",
      textShadowColor: "",
      songCount: 0,
    }) as EditableAlbum;
    album.hebrewName = "";
    return album;
  }

  private albumLoaded(album: Album | null): void {
    if (album) {
      this.album = album as EditableAlbum;
    } else {
      appNav.createAlbum();
      this.album = this.createNewAlbum();
    }
  }

  private updateAlbumField(field: keyof Album, value: string | boolean): void {
    if (!this.album) {
      return;
    }

    (this.album[field] as string | boolean) = value;
    if (field === "albumArtUri") {
      this.hasChangedAlbumArt = true;
    }
    this.album = { ...this.album };
  }

  private moveSong(song: ServerSong, direction: -1 | 1): void {
    if (!this.album?.songs) {
      return;
    }
    const currentIndex = this.album.songs.indexOf(song);
    const newIndex = currentIndex + direction;
    if (currentIndex >= 0 && newIndex >= 0 && newIndex < this.album.songs.length) {
      const songs = [...this.album.songs];
      songs.splice(currentIndex, 1);
      songs.splice(newIndex, 0, song);
      this.album = { ...this.album, songs };
    }
  }

  private async save(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    if (!this.album || this.album.isSaving) {
      return;
    }

    this.album.isSaving = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.album = { ...this.album };
    try {
      if (this.hasChangedAlbumArt && this.album.albumArtUri) {
        const saved = await albumApi.save(this.album);
        const changed = await albumApi.changeArt(saved.id, this.album.albumArtUri);
        this.album = (changed ?? saved) as EditableAlbum;
        this.hasChangedAlbumArt = false;
      } else {
        this.album = (await albumApi.save(this.album)) as EditableAlbum;
      }
      this.successMessage = "Album saved.";
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      if (this.album) {
        this.album.isSaving = false;
        this.album = { ...this.album };
      }
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private renderAlbumPreview(album: EditableAlbum) {
    if (!album.albumArtUri) {
      return nothing;
    }

    return html`
      <img class="album-art" src=${album.albumArtUri} alt=${`${album.name} album art`} style="max-height: 300px; max-width: 300px;" />
      <div style=${`width: 300px; padding: 10px; background-color: ${album.backgroundColor || "transparent"};`}>
        <div style=${`text-shadow: 0 0 5px ${album.textShadowColor || "transparent"};`}>
          <span style=${`color: ${album.foregroundColor || "inherit"};`}>Song Name Here</span><br />
          <span style=${`color: ${album.mutedColor || "inherit"};`}>By</span>
          <span style=${`color: ${album.foregroundColor || "inherit"};`}>${album.artist}</span><br />
          <span style=${`color: ${album.mutedColor || "inherit"};`}>on</span>
          <span style=${`color: ${album.foregroundColor || "inherit"};`}>${album.name}</span>
        </div>
      </div>
    `;
  }

  private renderSongs(album: EditableAlbum) {
    if (!album.songs?.length) {
      return nothing;
    }

    return html`
      <h4>Songs</h4>
      ${album.songs.map(
        (song, index) => html`
          <div class="song-container">
            <strong>${index + 1}. ${song.name}</strong>
            <wa-button title="Move up" ?disabled=${index === 0} @click=${() => this.moveSong(song, -1)}><wa-icon name="arrow-up"></wa-icon></wa-button>
            <wa-button title="Move down" ?disabled=${index === album.songs!.length - 1} @click=${() => this.moveSong(song, 1)}><wa-icon name="arrow-down"></wa-icon></wa-button>
          </div>
        `,
      )}
    `;
  }

  render() {
    const album = this.album;
    return html`
      <section class="page edit-album-page">
        <div class="admin-layout">
          <admin-sidebar active="albums"></admin-sidebar>
          <div>
            <h2>${album?.id ? "Edit Album" : "Create Album"}</h2>
            ${this.isLoading ? html`<h4><wa-spinner></wa-spinner> Loading album...</h4>` : nothing}
            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            ${this.successMessage
              ? html`<wa-callout variant="success"><wa-icon slot="icon" name="check"></wa-icon>${this.successMessage}</wa-callout>`
              : nothing}
            ${album
              ? html`
                  <form @submit=${(e: SubmitEvent) => this.save(e)}>
                    <wa-input label="Name" .value=${album.name} @input=${(e: Event) => this.updateAlbumField("name", (e.target as HTMLInputElement).value)}></wa-input>
                    <wa-input label="Hebrew name" lang="he" .value=${album.hebrewName ?? ""} @input=${(e: Event) => this.updateAlbumField("hebrewName", (e.target as HTMLInputElement).value)}></wa-input>
                    <wa-input label="Artist" .value=${album.artist} @input=${(e: Event) => this.updateAlbumField("artist", (e.target as HTMLInputElement).value)}></wa-input>
                    <wa-checkbox
                      ?checked=${album.isVariousArtists}
                      @change=${(e: Event) => this.updateAlbumField("isVariousArtists", (e.target as HTMLInputElement).checked)}
                    >
                      Contains many artists ("various artists")
                    </wa-checkbox>
                    <wa-input label="Album art" .value=${album.albumArtUri ?? ""} @input=${(e: Event) => this.updateAlbumField("albumArtUri", (e.target as HTMLInputElement).value)}></wa-input>
                    ${this.renderAlbumPreview(album)}
                    <p class="text-muted">// Filepicker and Vibrant.js color extraction omitted; paste art URLs and edit colors manually.</p>
                    <div class="row">
                      <div class="col-sm-3"><wa-input type="color" label="Fore" .value=${album.foregroundColor || "#000000"} @input=${(e: Event) => this.updateAlbumField("foregroundColor", (e.target as HTMLInputElement).value)}></wa-input></div>
                      <div class="col-sm-3"><wa-input type="color" label="Background" .value=${album.backgroundColor || "#ffffff"} @input=${(e: Event) => this.updateAlbumField("backgroundColor", (e.target as HTMLInputElement).value)}></wa-input></div>
                      <div class="col-sm-3"><wa-input type="color" label="Muted" .value=${album.mutedColor || "#666666"} @input=${(e: Event) => this.updateAlbumField("mutedColor", (e.target as HTMLInputElement).value)}></wa-input></div>
                      <div class="col-sm-3"><wa-input type="color" label="Text shadow" .value=${album.textShadowColor || "#000000"} @input=${(e: Event) => this.updateAlbumField("textShadowColor", (e.target as HTMLInputElement).value)}></wa-input></div>
                    </div>
                    ${this.renderSongs(album)}
                    <wa-button type="submit" variant="brand" ?disabled=${album.isSaving}>
                      ${album.isSaving ? html`<wa-spinner></wa-spinner> Saving...` : html`<wa-icon slot="start" name="floppy-disk"></wa-icon>Save`}
                    </wa-button>
                  </form>
                `
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
