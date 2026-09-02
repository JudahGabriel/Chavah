import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { albumApi } from "../services/album-api-service";
import type { AlbumSubmissionByArtist, TempFile } from "../models/server-interfaces";
import type { MediaFileUpload } from "../models/media-file-upload";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

type SubmissionState = "default" | "saving" | "error" | "complete";

@customElement("music-submission-page")
export class MusicSubmissionPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private artist = "";
  @state() private album = "";
  @state() private enrollInMessiahsMusicFund = false;
  @state() private email = "";
  @state() private payPalEmail = "";
  @state() private purchaseUrl = "";
  @state() private songs: MediaFileUpload[] = [];
  @state() private albumArt: MediaFileUpload | null = null;
  @state() private submissionState: SubmissionState = "default";
  @state() private validationMessage = "";

  private albumArtChanged(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) {
      this.albumArt = this.createMediaFile(file, file.name);
      input.setCustomValidity("");
      this.validationMessage = "";
    }
  }

  private mp3sChanged(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      this.songs = [...this.songs, ...Array.from(input.files).map((file) => this.createSongFile(file))];
    }
    if (this.songs.length > 0) {
      input.setCustomValidity("");
      this.validationMessage = "";
    }
  }

  private createSongFile(file: File): MediaFileUpload {
    const indexOfDot = file.name.lastIndexOf(".");
    const songName = indexOfDot === -1 ? file.name : file.name.substring(0, indexOfDot);
    return this.createMediaFile(file, songName);
  }

  private createMediaFile(file: File, name: string): MediaFileUpload {
    return {
      name,
      file,
      error: null,
      id: null,
      cdnId: null,
      status: "queued",
      url: null,
    };
  }

  private moveSong(song: MediaFileUpload, direction: -1 | 1): void {
    const songIndex = this.songs.indexOf(song);
    const targetIndex = songIndex + direction;
    if (songIndex !== -1 && targetIndex >= 0 && targetIndex < this.songs.length) {
      const songs = [...this.songs];
      [songs[songIndex], songs[targetIndex]] = [songs[targetIndex], songs[songIndex]];
      this.songs = songs;
    }
  }

  private removeSong(song: MediaFileUpload): void {
    this.songs = this.songs.filter((item) => item !== song);
  }

  private songNameChanged(song: MediaFileUpload, e: Event): void {
    song.name = (e.target as HTMLInputElement).value;
    this.songs = [...this.songs];
  }

  private async submit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.validateSubmission()) {
      return;
    }

    this.submissionState = "saving";
    try {
      await this.uploadMp3sAndAlbumArt();
      await albumApi.uploadAlbumSubmissionByArtist(this.createSubmission());
      this.submissionState = "complete";
    } catch (error) {
      console.error("Music submission failed due to an error.", error);
      this.submissionState = "error";
    }
  }

  private validateSubmission(): boolean {
    const albumInput = document.querySelector(".music-submission-page #albumArt") as HTMLInputElement | null;
    const songInput = document.querySelector(".music-submission-page #songFiles") as HTMLInputElement | null;

    if (!this.albumArt) {
      albumInput?.setCustomValidity("Please upload your album art.");
      this.validationMessage = "Please upload your album art.";
      albumInput?.reportValidity();
      return false;
    }
    if (this.songs.length === 0) {
      songInput?.setCustomValidity("You must upload at least one song.");
      this.validationMessage = "You must upload at least one song.";
      songInput?.reportValidity();
      return false;
    }
    this.validationMessage = "";
    return true;
  }

  private async uploadMp3sAndAlbumArt(): Promise<void> {
    if (!this.albumArt) {
      throw new Error("Album art must not be null.");
    }
    const mediaUploadTasks = [...this.songs, this.albumArt].filter((file) => !file.url).map((file) => this.uploadTempFile(file));
    await Promise.all(mediaUploadTasks);
  }

  private async uploadTempFile(mediaFile: MediaFileUpload): Promise<void> {
    mediaFile.status = "uploading";
    this.requestUpdate();
    try {
      const tempFile = await albumApi.uploadTempFile(mediaFile.file);
      mediaFile.id = tempFile.id;
      mediaFile.cdnId = tempFile.cdnId;
      mediaFile.url = tempFile.url;
      mediaFile.status = "completed";
    } catch (error) {
      mediaFile.status = "failed";
      mediaFile.error = error instanceof Error ? error.message : "Upload failed.";
      throw error;
    } finally {
      this.songs = [...this.songs];
      if (this.albumArt === mediaFile) {
        this.albumArt = { ...mediaFile };
      }
    }
  }

  private createSubmission(): AlbumSubmissionByArtist {
    if (!this.albumArt) {
      throw new Error("Album art must not be null.");
    }
    return {
      artistEmail: this.email,
      artistPayPalEmail: this.payPalEmail,
      name: this.album,
      hebrewName: null,
      artist: this.artist,
      albumArt: this.mediaFileToTempFile(this.albumArt),
      backColor: "#000000",
      foreColor: "#FFFFFF",
      mutedColor: "#000000",
      textShadowColor: "#000000",
      genres: "",
      purchaseUrl: this.purchaseUrl,
      songs: this.songs.map((song) => this.mediaFileToTempFile(song)),
    };
  }

  private mediaFileToTempFile(mediaFile: MediaFileUpload): TempFile {
    return {
      id: mediaFile.id || "",
      cdnId: mediaFile.cdnId,
      url: mediaFile.url || "",
      name: mediaFile.name,
      createdAt: new Date().toISOString(),
    };
  }

  private renderDefault() {
    return html`
      <h1 class="page-header">Submit Your Music to Chavah</h1>
      <p class="lead">
        Share your music with the Messianic community on Chavah. Upload your songs (MP3) and album art (JPG, PNG, or
        WEBP) below.
      </p>
      <form class="music-submission-form" @submit=${(e: Event) => this.submit(e)}>
        <wa-input label="Artist *" .value=${this.artist} required placeholder="Your Artist Name" @input=${(e: Event) => (this.artist = (e.target as HTMLInputElement).value)}>
          <wa-icon slot="start" name="circle-user"></wa-icon>
        </wa-input>
        <wa-input label="Album *" .value=${this.album} required placeholder="Your Album Name" @input=${(e: Event) => (this.album = (e.target as HTMLInputElement).value)}>
          <wa-icon slot="start" name="compact-disc"></wa-icon>
        </wa-input>
        <wa-input type="email" label="Your email address *" .value=${this.email} required placeholder="your.email@example.com" @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)}>
          <wa-icon slot="start" name="envelope"></wa-icon>
          <p slot="hint">We'll use this to contact you about your submission</p>
        </wa-input>
        <wa-input label="Link to your website, Bandcamp, YouTube, or ministry site." .value=${this.purchaseUrl} placeholder="https://my-web-site.com" @input=${(e: Event) => (this.purchaseUrl = (e.target as HTMLInputElement).value)}>
          <wa-icon slot="start" name="link"></wa-icon>
          <p slot="hint">This URL will be displayed whenever Chavah plays your music.</p>
        </wa-input>

        <div class="form-group">
          <label for="albumArt"><wa-icon name="image"></wa-icon> Upload album art <span class="text-danger">*</span> <span class="text-muted">(JPG, PNG, or WEBP)</span></label>
          <input type="file" id="albumArt" name="albumArt" class="form-control" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" @change=${(e: Event) => this.albumArtChanged(e)} />
          <p class="help-block">Recommended size: 1000x1000 pixels or larger.</p>
          ${this.albumArt ? html`<p><strong>Selected:</strong> ${this.albumArt.name}</p>` : nothing}
        </div>

        <div class="form-group">
          <label for="songFiles"><wa-icon name="music"></wa-icon> Upload songs <span class="text-danger">*</span> <span class="text-muted">(MP3 format)</span></label>
          <input type="file" id="songFiles" name="songFiles" class="form-control" accept=".mp3,audio/mpeg" multiple @change=${(e: Event) => this.mp3sChanged(e)} />
          ${this.renderSongs()}
        </div>

        <wa-checkbox
          ?checked=${this.enrollInMessiahsMusicFund}
          @change=${(e: Event) => (this.enrollInMessiahsMusicFund = (e.target as HTMLInputElement).checked)}
        >
          I want to receive royalty payments from Chavah
        </wa-checkbox>
        <p class="help-block">
          Check this box if you'd like to receive monthly royalty payments based on your music's play count. For more
          info, see <a target="_blank" href="/give">Messiah's Music Fund</a>
        </p>
        ${this.enrollInMessiahsMusicFund
          ? html`<wa-input type="email" label="PayPal email address" .value=${this.payPalEmail} placeholder="your.paypal@example.com" @input=${(e: Event) => (this.payPalEmail = (e.target as HTMLInputElement).value)}>
              <p slot="hint">Chavah will send royalty payments to this PayPal address.</p>
            </wa-input>`
          : nothing}
        ${this.validationMessage
          ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.validationMessage}</wa-callout>`
          : nothing}
        <wa-button type="submit" variant="brand"><wa-icon slot="start" name="cloud-arrow-up"></wa-icon> Submit Music</wa-button>
        ${this.params ? nothing : nothing}
      </form>
    `;
  }

  private renderSongs() {
    return html`
      <ol class="songs-container">
        ${this.songs.map(
          (song) => html`
            <li class="song">
              <div class="song-info">
                <wa-input required placeholder="Song Name" .value=${song.name} @input=${(e: Event) => this.songNameChanged(song, e)}></wa-input>
                <wa-button type="button" appearance="outlined" title="Move the song up in the list" @click=${() => this.moveSong(song, -1)}>
                  <wa-icon name="arrow-up"></wa-icon>
                </wa-button>
                <wa-button type="button" appearance="outlined" title="Move the song down in the list" @click=${() => this.moveSong(song, 1)}>
                  <wa-icon name="arrow-down"></wa-icon>
                </wa-button>
                <wa-button type="button" variant="danger" title="Remove the song" @click=${() => this.removeSong(song)}>
                  <wa-icon name="trash"></wa-icon>
                </wa-button>
                ${song.status !== "queued" ? html`<span>${song.status}</span>` : nothing}
              </div>
            </li>
          `,
        )}
      </ol>
    `;
  }

  private renderSaving() {
    return html`<h3><wa-spinner></wa-spinner> Submitting, please wait...</h3>`;
  }

  private renderError() {
    return html`
      <h3 class="text-danger"><wa-icon name="circle-exclamation"></wa-icon> Oh no, there was an error. (<span class="bow">✿</span>×_×;）</h3>
      <p>
        Sorry, there was a problem submitting your music. It's probably our fault. You can try submitting your music
        again, or <a href="/support">contact us</a> if you keep hitting the problem.
      </p>
      <wa-button variant="brand" @click=${() => (this.submissionState = "default")}>Try again</wa-button>
    `;
  }

  private renderComplete() {
    return html`
      <h1 class="page-header"><wa-icon name="circle-check" class="text-success"></wa-icon> Submitted! Chavah thanks you (<span class="bow">✿</span>◠‿◠)</h1>
      <p class="lead">
        Your music has been submitted to Chavah and will be reviewed. If approved, we'll contact you by email. Questions
        or comments? <a href="/support">Contact us</a>. Todah rabah, thanks for contributing your music to Chavah!
      </p>
      <wa-button variant="brand" href="/">Home</wa-button>
    `;
  }

  render() {
    return html`
      <section class="page music-submission-page">
        <div class="container">
          <div class="row">
            <div class="col-md-8 col-md-offset-2">
              ${this.submissionState === "default"
                ? this.renderDefault()
                : this.submissionState === "saving"
                  ? this.renderSaving()
                  : this.submissionState === "error"
                    ? this.renderError()
                    : this.renderComplete()}
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
