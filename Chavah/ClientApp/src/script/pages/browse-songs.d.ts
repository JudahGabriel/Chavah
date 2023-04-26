import { TemplateResult } from 'lit';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';
import { ChordService } from '../services/chord-service';
import { PagedResult } from '../models/paged-result';
declare type ChordsByLetter = {
    [letter: string]: ChordSheet[];
};
export declare class BrowseSongs extends BootstrapBase {
    readonly chordGrouping: ChordsByLetter;
    protected readonly chordService: ChordService;
    readonly allChords: PagedList<ChordSheet>;
    static get styles(): import("lit").CSSResultGroup[];
    constructor();
    connectedCallback(): void;
    protected fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    addToLetterGroup(chord: ChordSheet): void;
    render(): TemplateResult;
    renderMainContent(): TemplateResult;
    renderAdditionalContainerContent(): TemplateResult;
    renderLoading(): TemplateResult;
    renderChordsByGroup(): TemplateResult;
    renderLetterGroup(letter: string): TemplateResult;
    renderChord(chord: ChordSheet): TemplateResult;
}
export {};
