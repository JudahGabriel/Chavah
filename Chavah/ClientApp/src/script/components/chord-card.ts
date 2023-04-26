import { css, CSSResult, CSSResultGroup, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';
import { SizeMax } from '../common/constants';
import { ChordSheet } from '../models/interfaces';

@customElement('chord-card')
export class ChordCard extends BootstrapBase {

    @property({ type: Object }) chord: ChordSheet | null = null;

    static get styles(): CSSResultGroup {
        const localStyles = css`
            .chord-card {
                text-align: left;
                margin: 10px 30px;
                padding: 10px;
                float: left;
                width: 18em;
                cursor: pointer;
                transition: all linear 0.2s;
                justify-self: center;
            }

            @media(max-width: ${SizeMax.Xs}px) {
                .chord-card {
                    margin: 10px 20px;
                }
            }

            .chord-card:hover {
                background-color: rgba(0, 0, 0, .03);
                box-shadow: 0 0 10px 0 silver;
            }

            .artist {
                font-size: 16px;
                color: #0B0974;
                text-decoration: none;
            }

            .song-name,
            .hebrew-song-name {
                font-size: 26px;
                color: Brown;
                text-decoration: none;
                text-shadow: 1px 1px 1px silver;
                font-family: var(--title-font);
            }

            .hebrew-song-name {
                direction: rtl;
                text-align: right;
                padding-left: 10px;
            }

            label {
                color: black;
            }
        `;

        return [
            super.styles as CSSResult,
            localStyles
        ];
    }

    constructor() {
        super();
    }

    render() {
        if (!this.chord) {
            return html``;
        }

        return html`
            <div class="card chord-card">
                <div class="card-body">
                    <div class="card-title d-flex justify-content-between">
                        <a class="song-name" href="${this.chord.id}">
                            ${this.chord.song}
                        </a>
                        ${this.renderHebrewName()}
                    </div>
                    <h6 class="card-subtitle mb-2 text-muted">
                        <a class="artist" href="/artist/${encodeURIComponent(this.chord.artist || this.chord.authors[0])}">
                            ${this.chord.artist || this.chord.authors.join(", ")}
                        </a>
                    </h6>
                    ${this.renderKey()}
                </div>
            </div>
        `;
    }

    renderHebrewName() {
        if (this.chord && this.chord.hebrewSongName) {
            return html`
                <a class="hebrew-song-name" href="/${this.chord.id}" lang="he">
                    ${this.chord.hebrewSongName}
                </a>`
        }

        return html``;
    }

    renderKey() {
        if (this.chord && this.chord.key) {
            return html`
                <h6 class="card-subtitle mb-2 text-muted key">
                    <span>Key of</span>
                    ${this.chord.key}
                </h6>`;
        }

        return html``;
    }
}
