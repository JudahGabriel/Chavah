import { RouterLocation } from '@vaadin/router';
import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';
import { ChordSheet } from '../models/interfaces';
import { PagedResult } from '../models/paged-result';
import { BrowseArtists } from './browse-artists';

// This is the same functionality as browse artists page, only with a single artist
// So, we inherit from that page and just tweak it to display this artist.
@customElement('artist-songs')
export class ArtistSongs extends BrowseArtists {
    location: RouterLocation | null = null;

    static get styles() {
        const localStyles = css`
        `;
        return [
            BootstrapBase.styles,
            BrowseArtists.styles,
            localStyles
        ];
    }

    constructor() {
        super();
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const artistName = this.location?.params["name"] as string || null;
        const chunk = await this.chordService.getByArtistName(artistName, skip, take);

        // Sort them into our letter group.
        chunk.results.forEach(c => this.addToArtistGroup(c));

        return chunk;
    }
}