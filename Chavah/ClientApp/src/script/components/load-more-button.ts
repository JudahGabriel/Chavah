import { css, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';

@customElement('load-more-button')
export class LoadMoreButton extends BootstrapBase {
    @property({ type: Object }) list: PagedList<any> | null = null;

    static get styles() {
        const localStyles = css`
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.list) {
            this.list.addEventListener("changed", () => this.requestUpdate());
        }
    }

    render(): TemplateResult {
        if (!this.list || !this.list.hasMoreItems) {
            return html``;
        }

        if (this.list.isLoading) {
            return this.renderLoading();
        }

        return html`
            <button class="btn btn-secondary" type="button" @click="${this.getNextChunk}">
                Load more...
            </button>
        `;
    }

    renderLoading(): TemplateResult {
        return html`
            <button class="btn btn-secondary disabled" type="button">
                <span class="spinner-border" role="status">
                    <span class="visually-hidden"></span>
                </span>
                <span>Loading...</span>
            </button>
        `;
    }

    getNextChunk() {
        if (this.list) {
            this.list.getNextChunk();
        }
    }
}