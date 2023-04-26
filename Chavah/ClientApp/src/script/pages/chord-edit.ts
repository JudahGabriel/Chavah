import { Router, RouterLocation } from "@vaadin/router";
import { css, html, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { BootstrapBase } from "../common/bootstrap-base";
import { bytesToText, emptyChordSheet, inputEventChecked, inputEventNumber, inputEventValue } from "../common/utils";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import '../components/multiple-items-input';
import { focusOnInvalid } from "../common/focus-on-invalid-directive";

@customElement('chord-edit')
export class ChordEdit extends BootstrapBase {
    static get styles() {
        const localStyles = css`
            :host {
                font-family: var(--subtitle-font);
            }

            .chord-chart-text {
                white-space: pre;
                height: 9in;
                overflow: auto;
                font-family: monospace;
                font-size: 16px;
            }

            input::placeholder {
                color: rgba(0,0,0, 0.3);
            }
        `;
        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    @state() isNewChordSheet = false;
    @state() chord: ChordSheet | null = null;
    @state() error: string | null = null;
    @state() attachments: Array<File> = [];
    @state() submitError: string | null = null;
    @state() invalidFieldName: "name" | "artist-authors" | "chords" | "attachments" | "" = "";
    @state() isSubmitting = false;

    location: RouterLocation | null = null; // injected by the router
    chordService = new ChordService();

    static readonly maxAttachmentSizeInBytes = 10000000;

    constructor() {
        super();

        // When any input event fires, reset the validation field.
        this.addEventListener('input', () => this.invalidFieldName = "");
    }

    firstUpdated() {
        const id = this.location?.params["id"];
        if (id) {
            this.chordService.getById(`chordsheets/${id}`)
                .then(chordSheet => this.chordSheetLoaded(chordSheet))
                .catch(error => this.chordSheetLoadFailed(error));
        } else {
            this.isNewChordSheet = true;
            this.chord = emptyChordSheet();
        }
    }

    chordSheetLoaded(chordSheet: ChordSheet) {
        this.chord = chordSheet;
    }

    chordSheetLoadFailed(error: any) {
        this.error = error ? `${error}` : "Unable to load chord sheet";
    }

    render(): TemplateResult {
        return html`
            <div class="row">
                <div class="col-12 col-lg-6 offset-lg-3">
                    ${this.renderLoadingOrDetails()}
                </div>
            </div>
        `;
    }

    renderLoadingOrDetails(): TemplateResult {
        if (this.error) {
            return this.renderError();
        }

        if (!this.chord) {
            return this.renderLoading();
        }

        return this.renderChordEditor(this.chord);
    }

    renderChordEditor(chord: ChordSheet): TemplateResult {
        return html`
            <form>
                <!-- Name and Hebrew name row -->
                <div class="row">
                    <div class="col-6">
                        <div class="mb-3">
                            <label for="song-name-input" class="form-label" required>Song name</label>
                            <input
                                type="text"
                                class="form-control ${this.invalidFieldName === "name" ? "is-invalid" : ""}"
                                id="song-name-input"
                                placeholder="Shema Yisrael"
                                aria-describedby="song-name-help"
                                ${focusOnInvalid()}
                                value="${chord.song}"
                                @input="${(e: InputEvent) => chord.song = inputEventValue(e)}" />
                            <div class="invalid-feedback">
                                Please type a song name.
                            </div>
                            <div id="song-name-help" class="form-text">Required. The name of the song.</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="mb-3">
                            <label for="hebrew-song-name-input" class="form-label">Hebrew song name</label>
                            <input
                                type="text"
                                lang="he"
                                class="form-control ${this.invalidFieldName === "name" ? "is-invalid" : ""}"
                                id="hebrew-song-name-input"
                                placeholder="שמע ישראל"
                                value="${chord.hebrewSongName || ""}"
                                aria-describedby="hebrew-song-name-help"
                                @input="${(e: InputEvent) => chord.hebrewSongName = inputEventValue(e)}" />
                            <div id="hebrew-song-name-help" class="form-text">Optional. The Hebrew name of the song. If specified, this should use Hebrew characters.</div>
                        </div>
                    </div>
                </div>

                <!-- Artist and author row -->
                <br />
                <div class="row">
                    <div class="col-6">
                        <div class="mb-3">
                            <label for="artist-input" class="form-label">Artist</label>
                            <input
                                type="text"
                                class="form-control ${this.invalidFieldName === "artist-authors" ? "is-invalid" : ""}"
                                id="artist-input"
                                placeholder="Lamb"
                                value="${chord.artist}"
                                aria-describedby="artist-input-help"
                                ${focusOnInvalid()}
                                @input="${(e: InputEvent) => chord.artist = inputEventValue(e)}"/>
                            <div class="invalid-feedback">
                                You must specify either an <strong>artist</strong> or an <strong>author</strong>. If neither is known, use <mark>Unknown</mark> as the author.
                            </div>
                            <div id="artist-input-help" class="form-text">Optional. The artist who performed this arrangement of the song.</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="mb-3">
                            <label for="author-input" class="form-label">Authors</label>
                            <multiple-items-input
                                placeholder="Joel Chernoff"
                                help="Optional. The authors of the song. For unknown authors, use Unknown."
                                add-label="+"
                                add-tooltip="Add another author"
                                item-tooltip="Remove this author"
                                input-id="authors-input"
                                invalid="${this.invalidFieldName === "artist-authors"}"
                                .items="${chord.authors}">
                                <span slot="invalid-feedback">
                                    You must specify either an <strong>artist</strong> or an <strong>author</strong>. If neither is known, use <mark>Unknown</mark> as the author.
                                </span>
                            </multiple-items-input>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <label for="chord-chart-input" class="form-label">Chord chart</label>
                    <textarea
                        type="text"
                        class="form-control chord-chart-text ${this.invalidFieldName === "chords" ? "is-invalid" : ""}"
                        id="chord-chart-input"
                        placeholder="&nbsp;&nbsp;&nbsp;Em&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D&#x0a;Sh'ma Yisrael, sh'ma Yisrael"
                        aria-describedby="chord-chart-input-help"
                        ${focusOnInvalid()}
                        @input="${(e: InputEvent) => chord.chords = inputEventValue(e)}"
                        @paste="${this.chordsPasted}">${chord.chords || ""}</textarea>
                    <div class="invalid-feedback">
                        You must add the chord chart here or attach the chord chart file below. Attached files must be &lt; 10MB.
                    </div>
                    <div id="chord-chart-input-help" class="form-text">
                        <span class="text-muted">Optional. The chord chart for the song. If omitted, you can instead attach the chord chart file below.</span>
                    </div>
                </div>

                <!-- Attachments and links -->
                <div class="row">
                    <div class="col-lg-6 col-sm-12">
                        <div class="mb-3">
                            <label for="attachments-input" class="form-label">
                                <img src="/assets/bs-icons/paperclip.svg" width="24" height="24" />
                                Attachments
                            </label>
                            <input class="form-control" type="file" id="attachments-input" multiple aria-describedby="attachments-input-help" @input="${this.addAttachments}" />
                            <div id="attachments-input-help" class="form-text"><span class="text-muted">Optional. Attachments for the chord sheet. For example, a chord chart file (.pdf, .docx, .jpg, etc.), an audio recording of the song, piano sheet music, or other related files.</span></div>
                            <ul class="list-group mt-3">
                                ${repeat(this.attachments, a => this.attachments.indexOf(a), a => this.renderAttachment(a))}
                            </ul>
                        </div>
                    </div>
                    <div class="col-lg-6 col-sm-12">
                        <div class="mb-3">
                            <label for="links-input" class="form-label">
                                <img src="/assets/bs-icons/link.svg" width="24" height="24" />
                                Links
                            </label>
                            <multiple-items-input
                                placeholder="youtube.com/watch?v=EHnd21bzcaI"
                                aria-label="Links"
                                help="Optional. Links to YouTube videos, Chavah Messianic Radio songs, or other relevant resources for this song."
                                add-label="+"
                                add-tooltip="Add another link"
                                item-tooltip="Remove this link"
                                input-id="links-input"
                                type="url"
                                .items="${chord.links}"
                                @itemschanged="${this.linksChanged}">
                            </multiple-items-input>
                        </div>
                    </div>
                </div>

                <!-- Key, capo, and sheet music row -->
                <div class="row">
                    <div class="col-4">
                        <div class="mb-3">
                            <label for="key-input" class="form-label">Key</label>
                            <input type="text" class="form-control" id="key-input" placeholder="Em" value="${chord.key || ""}" aria-describedby="key-input-help" @input="${(e: InputEvent) => chord.key = inputEventValue(e)}" />
                            <div id="key-input-help" class="form-text">Optional. The musical key in which this song is played.</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="mb-3">
                            <label for="capo-input" class="form-label">Capo</label>
                            <input type="number" class="form-control" id="capo-input" placeholder="0" min="0" max="20" value="${chord.capo || ""}" aria-describedby="capo-input-help" @input="${(e: InputEvent) => chord.capo = inputEventNumber(e) || 0}" />
                            <div id="capo-input-help" class="form-text">Optional. The ideal guitar capo number used when playing this song.</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="mb-3">
                            <label for="scripture-input" class="form-label">Scripture</label>
                            <input type="text" class="form-control" id="scripture-input" placeholder="Deuteronomy 6:4" value="${chord.scripture || ""}" aria-describedby="scripture-input-help" @input="${(e: InputEvent) => chord.scripture = inputEventValue(e)}" />
                            <div id="scripture-input-help" class="form-text">Optional. The segment of Scripture relevant to this song.</div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-4 col-sm-12">
                        <div class="mb-3">
                            <label for="copyright-input" class="form-label">Copyright</label>
                            <input type="text" class="form-control" id="copyright-input" placeholder="Messianic Publishing Company" value="${chord.copyright || ""}" aria-describedby="copyright-input-help" @input="${(e: InputEvent) => chord.copyright = inputEventValue(e)}" />
                            <div id="copyright-input-help" class="form-text">Optional. The copyright of the song.</div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-sm-12">
                        <div class="mb-3">
                            <label for="copyright-input" class="form-label">CCLI</label>
                            <input type="number" class="form-control" id="ccli-input" placeholder="7112570" value="${chord.ccliNumber || ""}" aria-describedby="ccli-input-help" @input="${(e: InputEvent) => chord.ccliNumber = inputEventNumber(e)}" />
                            <div id="ccli-input-help" class="form-text">Optional. The Christian Copyright Licensing International (CCLI) number of the song.</div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-sm-12">
                        <div class="mb-3">
                            <label for="year-input" class="form-label">Year</label>
                            <input type="number" class="form-control" id="year-input" placeholder="1978" value="${chord.year || ""}" aria-describedby="year-input-help" @input="${(e: InputEvent) => chord.year = inputEventNumber(e)}" />
                            <div id="year-input-help" class="form-text">Optional. The year the song was authored.</div>
                        </div>
                    </div>
                </div>

                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input mt-4" id="sheet-music-input" aria-describedby="sheet-music-help" @input="${(e: InputEvent) => chord.isSheetMusic = inputEventChecked(e)}">
                    <label class="form-check-label mt-4" for="sheet-music-input">Contains sheet music</label>
                    <div id="sheet-music-help" class="form-text">If the attachments for this song contains musical notation files. <a href="/ChordSheets/4803" target="_blank">Example</a>.</div>
                </div>

                <div class="mb-3">
                    <label for="chord-chart-input" class="form-label">About</label>
                    <textarea
                        type="text"
                        class="form-control"
                        id="about-input"
                        rows="3"
                        placeholder="This song is based on..."
                        aria-describedby="about-input-help"
                        @input="${(e: InputEvent) => chord.about = inputEventValue(e)}">${chord.about || ""}</textarea>
                    <div id="chord-chart-input-help" class="form-text"><span class="text-muted">Optional. Additional information about the song, lyrics, or chord chart.</span></div>
                </div>

                <div class="d-grid gap-2">
                    ${this.renderSubmitButton()}
                </div>
                ${this.renderSubmitError()}

            </form>
        `;
    }

    renderLoading(): TemplateResult {
        return html`
            <div class="gx-2 row loading-name-artist">
                <div class="placeholder-glow col-6 col-sm-4 offset-sm-2">
                    <span class="placeholder w-100 d-inline-block"></span>
                </div>
                <div class="placeholder-glow col-6 col-sm-4">
                    <span class="placeholder w-100 d-inline-block"></span>
                </div>
            </div>

            <div class="mx-auto">
                <div class="w-100 h-100"></div>
            </div>
        `;
    }

    renderError(): TemplateResult {
        return html`
            <div class="alert alert-warning d-inline-block mx-auto" role="alert">
                Woops, we hit a problem loading this chord chart.
                <a href="${window.location.href}" class="alert-link">
                    Try again
                </a>
                <hr>
                <p class="mb-0">
                    Additional error details: ${this.error}
                </p>
            </div>
        `;
    }

    renderAttachment(attachment: File): TemplateResult {
        const name = attachment.name;
        const sizeTemplate = typeof attachment === "string" ? html`` : html`<small class="text-muted">(${bytesToText(attachment.size)})</small>`;
        const isTooLarge = attachment.size > ChordEdit.maxAttachmentSizeInBytes;
        const isTooMany = this.attachments.indexOf(attachment) > 9;
        const errorClass = isTooLarge || isTooMany ? "list-group-item-danger" : "";
        const errorMessage = isTooLarge ? html`<br><br><strong>Attachments must be < 10MB</strong>` :
            isTooMany ? html`<br><br><strong>Too many attachments. Max 10 attachments.</strong>` :
            html``;

        return html`
            <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ${errorClass}">
                <span class="text-break">
                    ${name}
                    ${sizeTemplate}
                    ${errorMessage}
                </span>
                <button type="button" class="btn-close" aria-label="Close" @click="${() => this.removeAttachment(attachment)}"></button>
            </li>
        `;
    }

    renderSubmitButton(): TemplateResult {
        const submittingHtml = html`
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Submitting...
        `;
        const buttonContents = this.isSubmitting ? submittingHtml : "Submit";
        return html
            `<button type="submit" class="btn btn-primary btn-block" ?disabled=${this.isSubmitting} @click="${this.submit}">
                ${buttonContents}
            </button>
        `;
    }

    renderSubmitError(): TemplateResult {
        if (!this.submitError) {
            return html``;
        }

        return html`
            <br>
            <div class="alert alert-danger" role="alert">
                <img src="/assets/bs-icons/exclamation-circle-fill.svg" /> ${this.submitError}
            </div>
        `;
    }

    addAttachments(e: InputEvent) {
        const attachmentsInput = e.target as HTMLInputElement;
        if (attachmentsInput.files && attachmentsInput.files.length > 0) {
            this.attachments = this.attachments.concat(...Array.from(attachmentsInput.files));
        }
    }

    removeAttachment(attachment: File | string): void {
        this.attachments = this.attachments.filter(a => a !== attachment);
    }

    linksChanged(e: CustomEvent) {
        const links = e.detail.items as string[];
        if (Array.isArray(links) && this.chord) {
            this.chord.links = links;
        }
    }

    chordsPasted(e: ClipboardEvent) {
        // When pasting chords into an empty box, do our best to reformat the spaces to our monospaced font.
        // Basically, 2 spaces in normal font ~= 1 space in monospace font. It's not perfect, but better

        // Punt if we already have chords.
        if (!this.chord || this.chord.chords) {
            return;
        }

        const pastedText = e.clipboardData?.getData("text");
        if (pastedText) {
            const chordsElement = this.shadowRoot?.querySelector("#chord-chart-input") as HTMLTextAreaElement;
            if (chordsElement) {
                chordsElement.value = pastedText.replace(/  /g, " ");
                e.preventDefault();
            }
        }
    }

    async submit(e: UIEvent) {
        e.preventDefault();
        if (this.isSubmitting) {
            return;
        }

        if (!this.chord) {
            this.submitError = "Chord is still loading, please wait a moment and try again.";
            return;
        }

        if (this.validateForm()) {
            this.isSubmitting = true;
            try {
                console.log("submitting chord sheet", this.chord);
                await this.chordService.submitChordEdit(this.chord!, this.attachments);
                this.navigateToSubmissionSuccessful();
            } catch (error: unknown) {
                console.log("Error submitting chord sheet", error);
                this.submitError = "We couldn't save your submission. Try again, or if the problem persists, please reach out to us: contact@messianicchords.com";
            } finally {
                this.isSubmitting = false;
            }
        }
    }

    navigateToSubmissionSuccessful() {
        if (!this.chord) {
            return;
        }

        if (this.isNewChordSheet) {
            Router.go("/ChordSheets/new/success");
        } else {
            Router.go(this.chord.id + "/edit/success")
        }
    }

    validateForm(): boolean {
        if (!this.chord) {
            this.submitError = "Chord is still loading, please wait a moment and try again."
            return false;
        }

        // Validate song name.
        if (!this.chord.song || !this.chord.song.trim()) {
            this.invalidFieldName = "name";
            return false;
        }

        // Validate artist & author. Rule: we must have either an artist or one author.
        const hasEmptyArtist = !this.chord.artist || !this.chord.artist.trim();
        const hasNoAuthors = this.chord.authors.length === 0;
        if (hasEmptyArtist && hasNoAuthors) {
            this.invalidFieldName = "artist-authors";
            return false;
        }

        // Validate chord chart.
        // Rule: we must either have a chord chart, or have an attachment(the chord file), or have a link to a Google doc.
        // Rule: if we have attachments, each attachment must be under 10MB
        const hasChordChart = !!this.chord.chords && !!this.chord.chords.trim();
        const hasGDocLink = this.chord.links.some(l => l.includes("docs.google.com") || l.includes("drive.google.com"));
        if (!hasChordChart && !hasGDocLink) {
            this.invalidFieldName = "chords";
            return false;
        }

        // More chord chart validation: attached files must be < 10MB. Can't have more than 10 attachments.
        const areAttachedFilesUnder10MB = this.attachments.every(a => a.size <= ChordEdit.maxAttachmentSizeInBytes);
        if (this.attachments.length > 0 && !areAttachedFilesUnder10MB) {
            this.invalidFieldName = "chords";
            return false;
        }
        if (this.attachments.length > 10) {
            this.invalidFieldName = "chords";
            return false;
        }

        return true;
    }
}