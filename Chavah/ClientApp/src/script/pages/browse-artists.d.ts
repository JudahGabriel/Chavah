import { TemplateResult } from 'lit';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BrowseSongs } from './browse-songs';
import { PagedResult } from '../models/paged-result';
export declare class BrowseArtists extends BrowseSongs {
    artists: string[];
    static get styles(): import("lit").CSSResultGroup[];
    constructor();
    protected firstUpdated(changedProps: Map<string | number | symbol, unknown>): void;
    renderAdditionalContainerContent(): TemplateResult;
    renderAllArtistsDropdown(): TemplateResult;
    renderArtist(artistName: string): TemplateResult;
    protected fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
    addToArtistGroup(chord: ChordSheet): void;
    jumpToArtistChanged(e: InputEvent): void;
}
