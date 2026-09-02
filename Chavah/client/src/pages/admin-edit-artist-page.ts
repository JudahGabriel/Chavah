import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { Artist } from "../models/artist";
import { artistApi } from "../services/artist-api-service";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";

@customElement("admin-edit-artist-page")
export class AdminEditArtistPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private artist: Artist | null = null;
  @state() private newImageUrl = "";
  @state() private isLoading = false;
  @state() private errorMessage = "";
  @state() private successMessage = "";

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadArtist();
  }

  private async loadArtist(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      const artistName = this.params.artistName;
      this.artist = artistName ? await artistApi.getByName(artistName) : new Artist();
    } catch (error) {
      this.errorMessage = this.formatError(error);
      this.artist = new Artist();
    } finally {
      this.isLoading = false;
    }
  }

  private updateArtistField(field: "name" | "bio", value: string): void {
    if (this.artist) {
      this.artist[field] = value;
      this.artist = new Artist(this.artist);
    }
  }

  private removeImage(image: string): void {
    if (this.artist) {
      this.artist.images = this.artist.images.filter((item) => item !== image);
      this.artist = new Artist(this.artist);
    }
  }

  private addImage(): void {
    const image = this.newImageUrl.trim();
    if (this.artist && image) {
      this.artist.images = [...this.artist.images, image];
      this.artist = new Artist(this.artist);
      this.newImageUrl = "";
    }
  }

  private async save(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    if (!this.artist || this.artist.isSaving) {
      return;
    }

    this.artist.isSaving = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.artist = new Artist(this.artist);
    try {
      const result = await artistApi.save(this.artist);
      this.artist.updateFrom(result);
      this.successMessage = "Artist saved.";
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      if (this.artist) {
        this.artist.isSaving = false;
        this.artist = new Artist(this.artist);
      }
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  render() {
    const artist = this.artist;
    return html`
      <section class="page edit-artist-page">
        <div class="admin-layout">
          <admin-sidebar active="albums"></admin-sidebar>
          <div>
            <h2>${this.params.artistName ? "Edit Artist" : "Create Artist"}</h2>
            ${this.isLoading ? html`<h4><wa-spinner></wa-spinner> Loading artist...</h4>` : nothing}
            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            ${this.successMessage
              ? html`<wa-callout variant="success"><wa-icon slot="icon" name="check"></wa-icon>${this.successMessage}</wa-callout>`
              : nothing}
            ${artist
              ? html`
                  <form @submit=${(e: SubmitEvent) => this.save(e)}>
                    <wa-input label="Name" .value=${artist.name} @input=${(e: Event) => this.updateArtistField("name", (e.target as HTMLInputElement).value)}></wa-input>
                    <wa-textarea label="Bio" rows="8" .value=${artist.bio} @input=${(e: Event) => this.updateArtistField("bio", (e.target as HTMLInputElement).value)}></wa-textarea>
                    <div class="form-group">
                      <label>Photos</label>
                      <div class="photos-container">
                        ${artist.images.map(
                          (image) => html`
                            <div class="img-container">
                              <img src=${image} class="img-thumbnail" alt=${`${artist.name} image`} />
                              <wa-button size="small" title="Remove artist image" @click=${() => this.removeImage(image)}>
                                <wa-icon name="xmark"></wa-icon>
                              </wa-button>
                            </div>
                          `,
                        )}
                      </div>
                      <p class="text-muted">// Filepicker image picker omitted; add image URLs directly.</p>
                      <wa-input label="Image URL" .value=${this.newImageUrl} @input=${(e: Event) => (this.newImageUrl = (e.target as HTMLInputElement).value)}></wa-input>
                      <wa-button type="button" @click=${() => this.addImage()} ?disabled=${!this.newImageUrl.trim()}>
                        <wa-icon slot="start" name="plus"></wa-icon>Add image
                      </wa-button>
                    </div>
                    <wa-button type="submit" variant="brand" ?disabled=${artist.isSaving}>
                      ${artist.isSaving ? html`<wa-spinner></wa-spinner> Saving...` : html`<wa-icon slot="start" name="floppy-disk"></wa-icon>Save`}
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
