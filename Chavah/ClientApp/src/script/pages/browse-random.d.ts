import { TemplateResult } from 'lit';
import '../components/chord-card';
import '../components/chord-card-loading';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { ChordService } from '../services/chord-service';
export declare class BrowseRandom extends BootstrapBase {
    chords: ChordSheet[];
    isLoading: boolean;
    readonly chordService: ChordService;
    static get styles(): import("lit").CSSResultGroup[];
    constructor();
    firstUpdated(): void;
    loadRandomChords(): Promise<void>;
    rollDice(): void;
    render(): TemplateResult;
    renderMainContent(): TemplateResult;
    renderLoading(): TemplateResult;
    renderChords(chords: ChordSheet[]): TemplateResult;
    renderChord(chord: ChordSheet | null): TemplateResult;
}
