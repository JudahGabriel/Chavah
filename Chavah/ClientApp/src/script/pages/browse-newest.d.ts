import { TemplateResult } from 'lit';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';
import { ChordService } from '../services/chord-service';
export declare class BrowseNewest extends BootstrapBase {
    chords: PagedList<ChordSheet>;
    readonly chordService: ChordService;
    static get styles(): import("lit").CSSResultGroup[];
    constructor();
    firstUpdated(): void;
    render(): TemplateResult;
    renderMainContent(): TemplateResult;
    renderLoading(): TemplateResult;
    renderChords(chords: PagedList<ChordSheet>): TemplateResult;
    renderChord(chord: ChordSheet | null): TemplateResult;
}
