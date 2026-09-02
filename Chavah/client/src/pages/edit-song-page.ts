import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { Song } from "../models/song";
import { accountService } from "../services/account-service";
import { songEditApi } from "../services/song-edit-service";
import { tagApi } from "../services/tag-service";
import type { SongEdit } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";

@customElement("edit-song-page")
export class EditSongPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private song: Song | null = null;
  @state() private tagsInput = "";
  @state() private isSaving = false;
  @state() private isSaveSuccess = false;
  @state() private isSaveFail = false;
  @state() private tags: string[] = [];
  @state() private tagSuggestions: string[] = [];
  private readonly isAdmin = !!accountService.currentUser && accountService.currentUser.isAdmin;
  private tagPlaceholder = "piano, violin, male vocal, hebrew, psalms";
  private contributingArtistsInput = "";

  connectedCallback(): void {
    super.connectedCallback();
    const songId = this.songId;
    if (songId) {
      songEditApi.getSongEdit(songId).then((result) => this.songEditLoaded(result));
    }
  }

  private get songId(): string {
    return this.params.id ? `songs/${this.params.id}` : "";
  }

  private songEditLoaded(songEdit: SongEdit): void {
    const song = Song.empty();
    song.id = songEdit.songId;
    song.name = songEdit.newName;
    song.uri = songEdit.newUri;
    song.hebrewName = songEdit.newHebrewName;
    song.album = songEdit.newAlbum;
    song.artist = songEdit.newArtist;
    song.lyrics = songEdit.newLyrics;
    song.albumArtUri = `/api/albums/getAlbumArtBySongId?songId=${encodeURIComponent(songEdit.songId)}`;
    song.tags = songEdit.newTags;
    song.contributingArtists = songEdit.newContributingArtists;
    this.song = song;
    this.tags = [...songEdit.newTags];
    if (this.tags.length > 0) {
      this.tagPlaceholder = "";
    }
    this.contributingArtistsInput = songEdit.newContributingArtists.join(", ");
  }

  private async tagsInputChanged(e: Event): Promise<void> {
    this.tagsInput = (e.target as HTMLInputElement).value;
    if (this.tagsInput.includes(",")) {
      const tags = this.tagsInput.split(",");
      this.tagsInput = "";
      tags.filter((tag) => tag && tag.length > 1).forEach((tag) => this.addTag(tag));
      return;
    }
    const search = this.tagsInput.trim();
    this.tagSuggestions = search.length > 0 ? await tagApi.searchTags(search) : [];
  }

  private removeTag(tag: string): void {
    this.tags = this.tags.filter((current) => current !== tag);
  }

  private autoCompleteTagSelected(tag: string): void {
    this.addTag(tag);
    this.tagsInput = "";
    this.tagSuggestions = [];
  }

  private addTag(tag: string): void {
    const tagLowered = tag.toLowerCase().trim();
    if (!this.tags.includes(tagLowered) && tagLowered.length > 1) {
      this.tags = [...this.tags, tagLowered];
      this.tagPlaceholder = "";
    }
  }

  private tagsEnterKeyPressed(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      if (this.tagsInput.length > 1) {
        this.autoCompleteTagSelected(this.tagsInput);
      }
    }
  }

  private updateSongField(field: keyof Song, value: string): void {
    if (this.song) {
      (this.song[field] as string) = value;
      this.requestUpdate();
    }
  }

  private submit(e: Event): void {
    e.preventDefault();
    if (this.song && !this.isSaving) {
      this.song.tags = this.tags;
      this.song.contributingArtists = this.contributingArtistsInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => !!item);

      this.isSaving = true;
      this.isSaveFail = false;
      songEditApi
        .submit(this.song)
        .then(() => (this.isSaveSuccess = true))
        .catch(() => (this.isSaveFail = true))
        .finally(() => (this.isSaving = false));
    }
  }

  private renderForm() {
    if (!this.song) {
      return html`<p>Loading...</p>`;
    }

    return html`
      <form @submit=${(e: Event) => this.submit(e)}>
        ${this.isAdmin
          ? html`
              <wa-input label="Name" .value=${this.song.name} placeholder="Song name" @input=${(e: Event) => this.updateSongField("name", (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Hebrew name" .value=${this.song.hebrewName ?? ""} placeholder="Song name" @input=${(e: Event) => this.updateSongField("hebrewName", (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Artist" .value=${this.song.artist} placeholder="Artist" @input=${(e: Event) => this.updateSongField("artist", (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Contributing artists (comma separated)" .value=${this.contributingArtistsInput} placeholder="Artist" @input=${(e: Event) => (this.contributingArtistsInput = (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input label="Album" .value=${this.song.album} placeholder="Album" @input=${(e: Event) => this.updateSongField("album", (e.target as HTMLInputElement).value)}></wa-input>
              <wa-input type="url" label="MP3 URL" .value=${this.song.uri} placeholder="https://..." @input=${(e: Event) => this.updateSongField("uri", (e.target as HTMLInputElement).value)}></wa-input>
            `
          : nothing}
        <wa-textarea label="Lyrics" rows="15" placeholder="Type the lyrics here" .value=${this.song.lyrics} @input=${(e: Event) => this.updateSongField("lyrics", (e.target as HTMLInputElement).value)}></wa-textarea>
        <div class="form-group">
          <label for="tagsInput"><wa-icon name="tags"></wa-icon> Tags</label>
          <div class="tags-container">
            ${this.tags.map(
              (tag) => html`<wa-tag removable @wa-remove=${() => this.removeTag(tag)}><wa-icon name="tag"></wa-icon> ${tag}</wa-tag>`,
            )}
          </div>
          <wa-input
            id="tagsInput"
            .value=${this.tagsInput}
            placeholder=${this.tagPlaceholder}
            @input=${(e: Event) => this.tagsInputChanged(e)}
            @keydown=${(e: KeyboardEvent) => this.tagsEnterKeyPressed(e)}
          ></wa-input>
          ${this.tagSuggestions.length
            ? html`<div class="tag-suggestions">
                ${this.tagSuggestions.map(
                  (tag) => html`<wa-button type="button" size="small" appearance="outlined" @click=${() => this.autoCompleteTagSelected(tag)}>${tag}</wa-button>`,
                )}
              </div>`
            : nothing}
          <p class="help-block">
            <wa-icon name="circle-info"></wa-icon> Optional. Song tags; characteristics about the song. Example: piano,
            male vocal, worship, hebrew, psalms
          </p>
        </div>
        <wa-button type="submit" variant="brand" ?disabled=${this.isSaving}><wa-icon slot="start" name="floppy-disk"></wa-icon> Submit</wa-button>
      </form>
    `;
  }

  render() {
    return html`
      <section class="page edit-song-page">
        <div class="row">
          <div class="col-xs-12 col-sm-8 col-sm-offset-2">
            <h3>Submit song lyrics and tags <br /><small class="text-muted">Thanks for helping us out and making Chavah better</small></h3>
            <div class="row">
              <div class="col-xs-12 col-sm-4">
                ${this.song ? html`<img class="img-thumbnail img-responsive" src=${this.song.albumArtUri} /><h3>${this.song.name} <br /><span class="text-muted">by</span> ${this.song.artist}</h3>` : nothing}
              </div>
              <div class="col-xs-12 col-sm-8">
                ${!this.isSaveSuccess && !this.isSaveFail ? this.renderForm() : nothing}
                ${this.isSaveSuccess
                  ? html`<wa-callout variant="success">
                      <wa-icon slot="icon" name="circle-check"></wa-icon>
                      <h2>Submitted! Chavah thanks you (✿◠‿◠)</h2>
                      <p>Your changes have been submitted and are under review by one of our moderators. If approved, your changes will be applied later today. Todah rabah!</p>
                      <wa-button variant="brand" href="/">Go back to the music</wa-button>
                    </wa-callout>`
                  : nothing}
                ${this.isSaveFail
                  ? html`<wa-callout variant="danger">
                      <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                      <h2>There was a problem. :-(</h2>
                      <p>We couldn't submit your changes. Make sure you're signed in. If the problem persists, <a href="/support">contact us</a>.</p>
                      <wa-button variant="brand" href="/">Go back to the music</wa-button>
                    </wa-callout>`
                  : nothing}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
