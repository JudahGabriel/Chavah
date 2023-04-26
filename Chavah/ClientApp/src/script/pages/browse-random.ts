import { css, html, TemplateResult } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, state } from 'lit/decorators.js';
import '../components/chord-card';
import '../components/chord-card-loading';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { ChordService } from '../services/chord-service';

@customElement('browse-random')
export class BrowseRandom extends BootstrapBase {
    @state() chords: ChordSheet[] = [];
    @state() isLoading = false;
    readonly chordService = new ChordService();

    static get styles() {
        const localStyles = css`
            .dice-1 {
                transform: rotateZ(-20deg);
                transition: .2s ease-in-out transform;
            }
            .dice-2 {
                transform: rotateZ(28deg);
                transition: .2s ease-in-out transform;
            }
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    constructor() {
        super();
    }

    firstUpdated() {
        this.loadRandomChords();
    }

    async loadRandomChords() {
        if (!this.isLoading) {
            this.rollDice();

            this.isLoading = true;
            try {
                this.chords = await this.chordService.getByRandom(7);
            } finally {
                this.isLoading = false;
            }
        }
    }

    rollDice() {
        const dice1 = this.shadowRoot?.querySelector(".dice-1") as HTMLImageElement;
        const dice2 = this.shadowRoot?.querySelector(".dice-2") as HTMLImageElement;
        const audio = new Audio("/assets/audio/dice.mp3");
        if (dice1) {
            dice1.style.transform = `rotateZ(${Math.floor(Math.random() * 360 * (Math.random() < .5 ? -1 : 1))}deg)`
        }
        if (dice2) {
            dice2.style.transform = `rotateZ(${Math.floor(Math.random() * 360) * (Math.random() < .5 ? -1 : 1)}deg)`
        }

        audio.playbackRate = 0.5 + Math.random();
        audio.play();
    }

    render(): TemplateResult {
        return html`
            <div class="container">
                <h3 class="highlight">Random</h3>
                <button ?disabled="${this.isLoading}" class="btn btn-light" @click="${() => this.loadRandomChords()}">
                    <img class="dice-1" src="/assets/bs-icons/dice-1.svg" />
                    <img class="dice-2" src="/assets/bs-icons/dice-6.svg" />
                    Roll again
                </button>
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderMainContent(): TemplateResult {
        if (this.isLoading) {
            return this.renderLoading();
        }

        return this.renderChords(this.chords);
    }

    renderLoading(): TemplateResult {
        const items = [1, 2, 3, 4, 5, 6, 7];
        return html`
            <div class="d-flex flex-wrap justify-content-evenly">
                ${repeat(items, i => i, () => html`
                <chord-card-loading></chord-card-loading>
                `)}
            </div>
        `;
    }

    renderChords(chords: ChordSheet[]): TemplateResult {
        return html`
            <div class="d-flex flex-wrap justify-content-evenly">
                ${repeat(chords, c => c.id, c => this.renderChord(c))}
            </div>
        `;
    }

    renderChord(chord: ChordSheet | null): TemplateResult {
        return html`
            <chord-card .chord="${chord}"></chord-card>
        `;
    }
}