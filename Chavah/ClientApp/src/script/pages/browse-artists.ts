import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { BrowseSongs } from './browse-songs';
import { PagedResult } from '../models/paged-result';
import { repeat } from 'lit/directives/repeat.js';
import { SizeMax } from '../common/constants';

// This component is the same as browse songs, only the grouping is by artist, rather than by first letter of song name.
// So, let's just inherit from BrowseSongs.
@customElement('browse-artists')
export class BrowseArtists extends BrowseSongs {
    @state() artists: string[] = [];

    static get styles() {
        const localStyles = css`
            .jump-to-artist {
                transform: translateY(32px);
                margin-top: -32px;
            }

            /* On small phones, don't shift it into the artist heading */
            @media (max-width: ${SizeMax.Xs}px) {
                .jump-to-artist {
                    transform: none;
                    margin-top: initial;
                }
            }
        `;

        return [
            BootstrapBase.styles,
            BrowseSongs.styles,
            localStyles
        ];
    }

    constructor() {
        super();
    }

    protected firstUpdated(changedProps: Map<string | number | symbol, unknown>): void {
        super.firstUpdated(changedProps);
        this.chordService.getAllArtists()
           .then(a => this.artists = a);
    }

    renderAdditionalContainerContent(): TemplateResult {
        return this.renderAllArtistsDropdown();
    }

    renderAllArtistsDropdown(): TemplateResult {
        return html`
            <div class="row jump-to-artist mb-4 mb-sm-0">
                <div class="col-lg-2 col-md-4 col-sm-4 offset-lg-9 offset-md-8 offset-sm-8">
                    <label for="artistDataList" class="form-label visually-hidden">Jump to artist</label>
                    <input class="form-control" list="artistOptions" id="artistDataList" placeholder="Jump to artist"
                        @input="${this.jumpToArtistChanged}">
                    <datalist id="artistOptions">
                        ${repeat(this.artists, a => a, a => this.renderArtist(a))}
                    </datalist>
                </div>
            </div>
        `;
    }

    renderArtist(artistName: string): TemplateResult {
        return html`
            <option value="${artistName}"></option>
        `;
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const chunk = await this.chordService.getByArtistName(null, skip, take);

        // Sort them into our artist group.
        chunk.results.forEach(c => this.addToArtistGroup(c));

        return chunk;
    }

    addToArtistGroup(chord: ChordSheet) {
        const artist = chord.artist;
        if (artist) {
            const chordsGroup = this.chordGrouping[artist];
            if (chordsGroup) {
                chordsGroup.push(chord);
            } else {
                this.chordGrouping[artist] = [chord];
            }
        }
    }

    jumpToArtistChanged(e: InputEvent) {
        const input = e.target as HTMLInputElement;
        // If we typed or selected an artist, jump to him.
        if (input && input.value.length > 3 && this.artists.includes(input.value)) {
            window.location.href = `/artist/${encodeURIComponent(input.value)}`;
        }
    }
}