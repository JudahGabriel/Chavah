import { RouterLocation } from "@vaadin/router";
import { TemplateResult } from "lit";
import { BootstrapBase } from "../common/bootstrap-base";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import '../components/multiple-items-input';
export declare class ChordEdit extends BootstrapBase {
    static get styles(): import("lit").CSSResultGroup[];
    isNewChordSheet: boolean;
    chord: ChordSheet | null;
    error: string | null;
    attachments: Array<File>;
    submitError: string | null;
    invalidFieldName: "name" | "artist-authors" | "chords" | "attachments" | "";
    isSubmitting: boolean;
    location: RouterLocation | null;
    chordService: ChordService;
    static readonly maxAttachmentSizeInBytes = 10000000;
    constructor();
    firstUpdated(): void;
    chordSheetLoaded(chordSheet: ChordSheet): void;
    chordSheetLoadFailed(error: any): void;
    render(): TemplateResult;
    renderLoadingOrDetails(): TemplateResult;
    renderChordEditor(chord: ChordSheet): TemplateResult;
    renderLoading(): TemplateResult;
    renderError(): TemplateResult;
    renderAttachment(attachment: File): TemplateResult;
    renderSubmitButton(): TemplateResult;
    renderSubmitError(): TemplateResult;
    addAttachments(e: InputEvent): void;
    removeAttachment(attachment: File | string): void;
    linksChanged(e: CustomEvent): void;
    chordsPasted(e: ClipboardEvent): void;
    submit(e: UIEvent): Promise<void>;
    navigateToSubmissionSuccessful(): void;
    validateForm(): boolean;
}
