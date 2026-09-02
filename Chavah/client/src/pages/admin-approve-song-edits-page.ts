import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { songEditApi } from "../services/song-edit-service";
import { tagApi } from "../services/tag-service";
import type { SongEdit } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";

interface PendingSongEdit extends SongEdit {
  id: string;
  submitDate: string;
  oldName: string;
  oldHebrewName: string | null;
  oldAlbum: string;
  oldArtist: string;
  oldLyrics: string;
  oldTags: string[];
  oldContributingArtists: string[];
  isSaving: boolean;
}

@customElement("admin-approve-song-edits-page")
export class AdminApproveSongEditsPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private pendingEdits: PendingSongEdit[] = [];
  @state() private currentEdit: PendingSongEdit | null = null;
  @state() private hasLoaded = false;
  @state() private tagsInput = "";
  @state() private tagSuggestions: string[] = [];
  @state() private errorMessage = "";

  private readonly dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "short" });

  firstUpdated(): void {
    void this.loadPendingEdits();
  }

  private async loadPendingEdits(): Promise<void> {
    this.errorMessage = "";
    try {
      const results = await songEditApi.getPendingEdits(100);
      this.pendingEdits = results.map((edit) => this.createSongEditViewModel(edit));
      this.setCurrentEdit(this.pendingEdits[0] ?? null);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.hasLoaded = true;
    }
  }

  private setCurrentEdit(songEdit: PendingSongEdit | null): void {
    this.currentEdit = songEdit;
    this.tagsInput = "";
    this.tagSuggestions = [];
  }

  private async approve(): Promise<void> {
    const edit = this.currentEdit;
    if (!edit || edit.isSaving) {
      return;
    }

    this.setEditSaving(edit, true);
    this.errorMessage = "";
    try {
      const result = await songEditApi.approve(edit);
      this.removeSongEdit(result.id ?? edit.id);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.setEditSaving(edit, false);
    }
  }

  private async reject(): Promise<void> {
    const edit = this.currentEdit;
    if (!edit || edit.isSaving) {
      return;
    }

    this.setEditSaving(edit, true);
    this.errorMessage = "";
    try {
      const result = await songEditApi.reject(edit.id);
      if (result) {
        this.removeSongEdit(result.id ?? edit.id);
      }
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.setEditSaving(edit, false);
    }
  }

  private setEditSaving(edit: PendingSongEdit, isSaving: boolean): void {
    edit.isSaving = isSaving;
    this.pendingEdits = [...this.pendingEdits];
    if (this.currentEdit === edit) {
      this.currentEdit = { ...edit };
    }
  }

  private removeSongEdit(editId: string): void {
    this.pendingEdits = this.pendingEdits.filter((edit) => edit.id !== editId);
    if (this.currentEdit?.id === editId) {
      this.setCurrentEdit(this.pendingEdits[0] ?? null);
    }
  }

  private updateCurrentEdit(changes: Partial<PendingSongEdit>): void {
    if (!this.currentEdit) {
      return;
    }

    const updated = { ...this.currentEdit, ...changes };
    this.currentEdit = updated;
    this.pendingEdits = this.pendingEdits.map((edit) => (edit.id === updated.id ? updated : edit));
  }

  private updateCurrentEditText(field: "newName" | "newHebrewName" | "newAlbum" | "newArtist" | "newLyrics", value: string): void {
    this.updateCurrentEdit({ [field]: value });
  }

  private removeTag(tag: string): void {
    if (this.currentEdit) {
      this.updateCurrentEdit({ newTags: this.currentEdit.newTags.filter((item) => item !== tag) });
    }
  }

  private async tagsInputChanged(e: Event): Promise<void> {
    this.tagsInput = (e.target as HTMLInputElement).value;
    if (this.tagsInput.includes(",")) {
      const tags = this.tagsInput.split(",");
      this.tagsInput = "";
      this.tagSuggestions = [];
      tags.filter((tag) => tag && tag.length > 1).forEach((tag) => this.addTag(tag));
      return;
    }

    const search = this.tagsInput.trim();
    this.tagSuggestions = search ? await tagApi.searchTags(search) : [];
  }

  private tagsEnterKeyPressed(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      if (this.tagsInput.length > 1) {
        this.autoCompleteTagSelected(this.tagsInput);
      }
    }
  }

  private autoCompleteTagSelected(tag: string): void {
    this.addTag(tag);
    this.tagsInput = "";
    this.tagSuggestions = [];
  }

  private addTag(tag: string): void {
    if (!this.currentEdit) {
      return;
    }

    const tagLowered = tag.toLowerCase().trim();
    if (!this.currentEdit.newTags.includes(tagLowered) && tagLowered.length > 1) {
      this.updateCurrentEdit({ newTags: [...this.currentEdit.newTags, tagLowered] });
    }
  }

  private updateContributingArtists(value: string): void {
    this.updateCurrentEdit({
      newContributingArtists: value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => !!item),
    });
  }

  private createSongEditViewModel(songEdit: SongEdit): PendingSongEdit {
    return {
      ...songEdit,
      id: songEdit.id ?? "",
      submitDate: songEdit.submitDate ?? new Date().toISOString(),
      oldName: songEdit.oldName ?? "",
      oldHebrewName: songEdit.oldHebrewName ?? null,
      oldAlbum: songEdit.oldAlbum ?? "",
      oldArtist: songEdit.oldArtist ?? "",
      oldLyrics: songEdit.oldLyrics ?? "",
      oldTags: songEdit.oldTags ?? [],
      oldContributingArtists: songEdit.oldContributingArtists ?? [],
      isSaving: false,
    };
  }

  private getFriendlyDate(songEdit: PendingSongEdit): string {
    return this.dateFormatter.format(new Date(songEdit.submitDate));
  }

  private hasNewerEdit(songEdit: PendingSongEdit): boolean {
    return this.pendingEdits.some(
      (edit) => edit !== songEdit && edit.songId === songEdit.songId && new Date(edit.submitDate) > new Date(songEdit.submitDate),
    );
  }

  private hasFieldChange(oldValue: string | null, newValue: string | null): boolean {
    return (oldValue ?? "") !== (newValue ?? "");
  }

  private hasTagChanges(edit: PendingSongEdit): boolean {
    return edit.newTags.length !== edit.oldTags.length || edit.newTags.some((tag, index) => edit.oldTags[index] !== tag);
  }

  private getTagClass(edit: PendingSongEdit, tag: string): string {
    const includedInNewTags = edit.newTags.includes(tag);
    const includedInOldTags = edit.oldTags.includes(tag);
    if (includedInNewTags && !includedInOldTags) {
      return "added-tag";
    }
    if (!includedInNewTags && includedInOldTags) {
      return "removed-tag";
    }
    return "";
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private renderFieldComparison(label: string, oldValue: string | null, newValue: string | null, field: "newName" | "newHebrewName" | "newAlbum" | "newArtist") {
    return html`
      <div class="form-group">
        <label>${label} ${this.hasFieldChange(oldValue, newValue) ? nothing : html`<span class="text-info">- no changes</span>`}</label>
        <div class="row">
          <div class="col-xs-12 col-sm-6">
            <wa-input .value=${newValue ?? ""} @input=${(e: Event) => this.updateCurrentEditText(field, (e.target as HTMLInputElement).value)}></wa-input>
          </div>
          <div class="col-xs-12 col-sm-6">
            <wa-input .value=${oldValue ?? ""} readonly></wa-input>
          </div>
        </div>
      </div>
    `;
  }

  private renderTags(edit: PendingSongEdit) {
    return html`
      <div class="form-group">
        <label><wa-icon name="tags"></wa-icon> Tags ${this.hasTagChanges(edit) ? nothing : html`<span class="text-info">- no changes</span>`}</label>
        <div class="row">
          <div class="col-xs-12 col-sm-6">
            <h5>New</h5>
            <div class="tags-container">
              ${edit.newTags.map(
                (tag) => html`
                  <span class=${`tag ${this.getTagClass(edit, tag)}`}>
                    <wa-icon name="tag"></wa-icon> ${tag}
                    <wa-button size="small" title="Remove tag" @click=${() => this.removeTag(tag)}><wa-icon name="xmark"></wa-icon></wa-button>
                  </span>
                `,
              )}
            </div>
            <wa-input
              id="tagsInput"
              .value=${this.tagsInput}
              placeholder="Add tag"
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
          </div>
          <div class="col-xs-12 col-sm-6">
            <h5>Old</h5>
            <div class="tags-container">
              ${edit.oldTags.map((tag) => html`<span class=${`tag ${this.getTagClass(edit, tag)}`}><wa-icon name="tag"></wa-icon> ${tag}</span>`)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderCurrentEdit(edit: PendingSongEdit) {
    return html`
      <h3>${edit.oldArtist} - ${edit.oldName}</h3>
      <h5>Submitted by ${edit.userId ?? "unknown"}</h5>
      <form @submit=${(e: SubmitEvent) => e.preventDefault()}>
        ${this.renderFieldComparison("Name", edit.oldName, edit.newName, "newName")}
        ${this.renderFieldComparison("Hebrew name", edit.oldHebrewName, edit.newHebrewName, "newHebrewName")}
        ${this.renderFieldComparison("Album", edit.oldAlbum, edit.newAlbum, "newAlbum")}
        ${this.renderFieldComparison("Artist", edit.oldArtist, edit.newArtist, "newArtist")}
        <div class="form-group">
          <label>
            Contributing artists
            ${edit.oldContributingArtists.join(", ") !== edit.newContributingArtists.join(", ")
              ? nothing
              : html`<span class="text-info">- no changes</span>`}
          </label>
          <div class="row">
            <div class="col-xs-12 col-sm-6">
              <wa-input
                .value=${edit.newContributingArtists.join(", ")}
                @input=${(e: Event) => this.updateContributingArtists((e.target as HTMLInputElement).value)}
              ></wa-input>
            </div>
            <div class="col-xs-12 col-sm-6">
              <wa-input .value=${edit.oldContributingArtists.join(", ")} readonly></wa-input>
            </div>
          </div>
        </div>
        ${this.renderTags(edit)}
        <div class="form-group">
          <label>Lyrics ${this.hasFieldChange(edit.oldLyrics, edit.newLyrics) ? nothing : html`<span class="text-info">- no changes</span>`}</label>
          <div class="row">
            <div class="col-xs-12 col-sm-6">
              <wa-textarea rows="20" .value=${edit.newLyrics} @input=${(e: Event) => this.updateCurrentEditText("newLyrics", (e.target as HTMLInputElement).value)}></wa-textarea>
            </div>
            <div class="col-xs-12 col-sm-6">
              <wa-textarea rows="20" .value=${edit.oldLyrics} readonly></wa-textarea>
            </div>
          </div>
        </div>
        <wa-button variant="brand" ?disabled=${edit.isSaving} @click=${() => this.approve()}>
          ${edit.isSaving ? html`<wa-spinner></wa-spinner> Saving...` : html`<wa-icon slot="start" name="floppy-disk"></wa-icon>Approve`}
        </wa-button>
        <wa-button variant="danger" ?disabled=${edit.isSaving} @click=${() => this.reject()}>
          <wa-icon slot="start" name="xmark"></wa-icon>Reject
        </wa-button>
      </form>
    `;
  }

  render() {
    return html`
      <section class="approve-song-edits-page admin-page">
        <div class="admin-layout">
          <admin-sidebar active="songedits"></admin-sidebar>
          <div>
            ${!this.hasLoaded ? html`<h4><wa-spinner></wa-spinner> Loading pending song edits...</h4>` : nothing}
            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            ${this.hasLoaded && this.pendingEdits.length === 0
              ? html`<h3 class="text-center"><wa-icon name="circle-info"></wa-icon> No pending edits</h3>`
              : nothing}
            ${this.pendingEdits.length
              ? html`
                  <div class="row" style="margin-top: 20px;">
                    <div class="col-xs-12 col-sm-3">
                      <div class="list-group" style="overflow: auto; max-height: 700px;">
                        ${this.pendingEdits.map(
                          (edit) => html`
                            <a
                              href="javascript:void(0)"
                              class=${`list-group-item ${this.currentEdit?.id === edit.id ? "active" : ""}`}
                              @click=${() => this.setCurrentEdit(edit)}
                            >
                              ${edit.oldArtist} - ${edit.oldName}<br />
                              <span class="text-muted">${this.getFriendlyDate(edit)}</span>
                              ${this.hasNewerEdit(edit) ? html`<span class="text-danger"><br />[warning: newer edit available]</span>` : nothing}
                            </a>
                          `,
                        )}
                      </div>
                    </div>
                    <div class="col-xs-12 col-sm-9">${this.currentEdit ? this.renderCurrentEdit(this.currentEdit) : nothing}</div>
                  </div>
                `
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
