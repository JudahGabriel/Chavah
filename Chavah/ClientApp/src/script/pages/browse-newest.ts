import { css, html, TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';
import { ChordService } from '../services/chord-service';

@customElement('browse-newest')
export class BrowseNewest extends BootstrapBase {

    @property({ type: Object }) chords: PagedList<ChordSheet>;
    readonly chordService = new ChordService();

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
        this.chords = new PagedList<ChordSheet>((skip, take) => this.chordService.getNew(skip, take));
        this.chords.take = 20;
        this.chords.addEventListener("changed", () => this.requestUpdate());
    }

    firstUpdated() {
        this.chords.getNextChunk();
    }

    render(): TemplateResult {
        return html`
            <div class="container">
                <h3 class="highlight">Newest</h3>
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderMainContent(): TemplateResult {
        if (!this.chords) {
            return html``;
        }

        if (this.chords.isLoading && this.chords.items.length === 0) {
            return this.renderLoading();
        }

        return this.renderChords(this.chords);
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

    renderChords(chords: PagedList<ChordSheet>): TemplateResult {
        return html`
            <div class="d-flex flex-wrap justify-content-evenly">
                ${repeat(chords.items, c => c.id, c => this.renderChord(c))}
            </div>
            
            <div class="text-center mt-3">
                <load-more-button .list="${chords}"></load-more-button>
            </div>
        `;
    }

    renderChord(chord: ChordSheet | null): TemplateResult {
        return html`
            <chord-card .chord="${chord}"></chord-card>
        `;
    }
}