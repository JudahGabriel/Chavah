import { TemplateResult } from 'lit';
import '../components/chord-card';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { ChordService } from '../services/chord-service';
import { BehaviorSubject } from 'rxjs';
export declare class AppHome extends BootstrapBase {
    static get styles(): import("lit").CSSResultGroup[];
    newChords: ChordSheet[];
    isLoading: boolean;
    searchResults: ChordSheet[];
    newChordsSkip: number;
    readonly chordService: ChordService;
    readonly searchText: BehaviorSubject<string>;
    constructor();
    connectedCallback(): void;
    searchTextChanged(e: Event): void;
    fetchNextNewChords(): Promise<void>;
    updateSearchQueryString(search: string): void;
    runSearch(query: string): Promise<void>;
    render(): TemplateResult<1>;
    renderNewChords(): TemplateResult;
    renderNewChordsPlaceholder(): TemplateResult;
    renderNewChordLink(newChordSheet: ChordSheet, index: number): TemplateResult;
    renderLoading(): TemplateResult;
    renderSearchResult(chordSheet: ChordSheet): TemplateResult;
}
