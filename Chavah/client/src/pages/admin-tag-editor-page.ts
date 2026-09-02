import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { tagApi } from "../services/tag-service";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

@customElement("admin-tag-editor-page")
export class AdminTagEditorPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private allTags: string[] = [];
  @state() private selectedTag: string | null = null;
  @state() private newTagName = "";
  @state() private isSaving = false;
  @state() private isLoading = false;
  @state() private errorMessage = "";

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadTags();
  }

  private async loadTags(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      this.allTags = (await tagApi.getAll()).sort((a, b) => a.localeCompare(b));
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private selectTag(tag: string | null): void {
    this.newTagName = tag ?? "";
    this.selectedTag = tag;
  }

  private async deleteTag(tag: string): Promise<void> {
    if (this.isSaving || !confirm(`Delete tag "${tag}"?`)) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = "";
    try {
      await tagApi.deleteTag(tag);
      this.allTags = this.allTags.filter((t) => t !== tag);
      this.selectTag(null);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isSaving = false;
    }
  }

  private async renameTag(oldTag: string): Promise<void> {
    const newTagName = this.newTagName.trim();
    if (this.isSaving || !newTagName || newTagName === oldTag) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = "";
    try {
      const result = await tagApi.renameTag(oldTag, newTagName);
      this.allTags = Array.from(new Set(this.allTags.map((tag) => (tag === oldTag ? result : tag)))).sort((a, b) =>
        a.localeCompare(b),
      );
      this.selectTag(result);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isSaving = false;
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  render() {
    return html`
      <section class="tag-editor-page admin-page">
        <div class="admin-layout">
          <admin-sidebar active="tags"></admin-sidebar>
          <div>
            <div class="row" style="margin-top: 20px;">
              <div class="col-xs-12 col-sm-4">
                ${this.isLoading ? html`<h4><wa-spinner></wa-spinner> Loading tags...</h4>` : nothing}
                <div class="list-group tags-list">
                  ${this.allTags.map(
                    (tag) => html`
                      <a href="javascript:void(0)" class=${`list-group-item ${this.selectedTag === tag ? "active" : ""}`} @click=${() => this.selectTag(tag)}>
                        ${tag}
                      </a>
                    `,
                  )}
                </div>
              </div>
              <div class="col-xs-12 col-sm-8">
                ${this.errorMessage
                  ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
                  : nothing}
                ${this.selectedTag
                  ? html`
                      <form @submit=${(e: SubmitEvent) => { e.preventDefault(); void this.renameTag(this.selectedTag!); }}>
                        <wa-input label="Tag name" .value=${this.newTagName} ?disabled=${this.isSaving} @input=${(e: Event) => (this.newTagName = (e.target as HTMLInputElement).value)}></wa-input>
                        <br />
                        <wa-button variant="danger" ?disabled=${this.isSaving} @click=${() => this.deleteTag(this.selectedTag!)}>
                          <wa-icon slot="start" name="trash"></wa-icon>Delete
                        </wa-button>
                        <wa-button type="submit" variant="brand" ?disabled=${this.isSaving || !this.newTagName.trim() || this.newTagName.trim() === this.selectedTag}>
                          <wa-icon slot="start" name="floppy-disk"></wa-icon>Save
                        </wa-button>
                      </form>
                    `
                  : nothing}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
}
