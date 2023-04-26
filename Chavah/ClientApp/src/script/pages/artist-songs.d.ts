import { RouterLocation } from '@vaadin/router';
import { ChordSheet } from '../models/interfaces';
import { PagedResult } from '../models/paged-result';
import { BrowseArtists } from './browse-artists';
export declare class ArtistSongs extends BrowseArtists {
    location: RouterLocation | null;
    static get styles(): import("lit").CSSResultGroup[];
    constructor();
    protected fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>>;
}
