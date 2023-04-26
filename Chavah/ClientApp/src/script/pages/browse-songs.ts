import { css, html, TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement } from 'lit/decorators.js';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';
import { ChordService } from '../services/chord-service';
import { PagedResult } from '../models/paged-result';

type ChordsByLetter = { [letter: string]: ChordSheet[] };

@customElement('browse-songs')
export class BrowseSongs extends BootstrapBase {

    readonly chordGrouping: ChordsByLetter = {};
    protected readonly chordService = new ChordService();
    readonly allChords: PagedList<ChordSheet>;

    static get styles() {
        const localStyles = css`
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    constructor() {
        super();
        this.allChords = new PagedList<ChordSheet>((skip, take) => this.fetchNextChunk(skip, take));
        this.allChords.take = 100;
        this.allChords.addEventListener("changed", () => this.requestUpdate());
    }

    connectedCallback() {
        super.connectedCallback();
        this.allChords.getNextChunk();
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const chunk = await this.chordService.getBySongName(skip, take);

        // Sort them into our letter group.
        chunk.results.forEach(c => this.addToLetterGroup(c));

        return chunk;
    }

    addToLetterGroup(chord: ChordSheet) {
        const firstLetter = chord.song[0];
        if (firstLetter) {
            const chordsGroup = this.chordGrouping[firstLetter];
            if (chordsGroup) {
                chordsGroup.push(chord);
            } else {
                this.chordGrouping[firstLetter] = [chord];
            }
        }
    }

    render(): TemplateResult {
        return html`
            <div class="container">
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderMainContent(): TemplateResult {
        if (this.allChords.isLoading && this.allChords.items.length === 0) {
            return this.renderLoading();
        }

        return html`
            ${this.renderAdditionalContainerContent()}
            ${this.renderChordsByGroup()}
        `;
    }

    renderAdditionalContainerContent(): TemplateResult {
        return html``;
    }

    renderLoading(): TemplateResult {
        const items = [1, 2, 3];
        return html`
            <div class="d-flex flex-wrap justify-content-evenly">
                ${repeat(items, i => i, () => html`
                <chord-card-loading></chord-card-loading>
                `)}
            </div>
        `;
    }

    renderChordsByGroup(): TemplateResult {
        const letters = Object.keys(this.chordGrouping).sort();
        return html`
            ${letters.map(l => this.renderLetterGroup(l))}
            
            <div class="text-center mt-3">
                <load-more-button .list="${this.allChords}"></load-more-button>
            </div>
        `;
    }

    renderLetterGroup(letter: string): TemplateResult {

        const chords = this.chordGrouping[letter];
        if (!chords) {
            return html``;
        }

        return html`
            <h3 class="highlight">${letter}</h3>
            <div class="d-flex flex-wrap justify-content-evenly mb-5">
                ${repeat(chords, c => c.id, c => this.renderChord(c))}
            </div>
        `;
    }

    renderChord(chord: ChordSheet): TemplateResult {
        return html`
            <chord-card .chord="${chord}"></chord-card>
        `;
    }
}