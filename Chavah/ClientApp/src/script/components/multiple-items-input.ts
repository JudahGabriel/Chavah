import { css, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { BootstrapBase } from '../common/bootstrap-base';
import { guid, inputEventValue } from '../common/utils';
import { createRef, ref } from 'lit/directives/ref.js';
import { focusOnInvalid } from '../common/focus-on-invalid-directive';

@customElement('multiple-items-input')
export class MultipleItemsInput extends BootstrapBase {
    @state() id = guid();
    @property() items: string[] = [];
    @property() placeholder: string = "";
    @property({ attribute: 'aria-label' }) ariaLabel = "";
    @property({ attribute: 'help' }) help = "";
    @property() value = "";
    @property({ attribute: 'add-label' }) addLabel = "+";
    @property({ attribute: 'add-tooltip' }) addTooltip = "Add another";
    @property({ attribute: 'item-tooltip' }) itemTooltip = "Remove this item";
    @property({ attribute: 'input-id' }) inputId = `input-${this.id}`;
    @property() invalid: string | null | undefined = undefined;
    @property() type: "text" | "url" | undefined = undefined;
    inputRef = createRef<HTMLInputElement>();

    static get styles() {
        const localStyles = css`
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    render(): TemplateResult {
        return html`
            <div class="input-group">
                <input
                    id="${this.inputId}"
                    class="form-control ${this.invalid === "true" ? "is-invalid" : ""}"
                    value="${this.value}"
                    placeholder="${this.items.length === 0 ? this.placeholder : ""}"
                    aria-label="${this.ariaLabel}"
                    aria-describedby="help-text-${this.id}"
                    @input="${(e: InputEvent) => this.value = inputEventValue(e)}"
                    @change="${this.inputChanged}"
                    @keydown="${this.handleKeyDown}"
                    ${ref(this.inputRef)}
                    ${focusOnInvalid()} />
                <button class="btn btn-outline-secondary" type="button" id="add-item-btn-${this.id}" @click="${this.addButtonClicked}" title="${this.addTooltip}">
                    ${this.addLabel}
                </button>
                <div class="invalid-feedback">
                    <slot name="invalid-feedback"></slot>
                </div>
            </div>
            ${this.renderItems()}
            ${this.renderHelpText()}
        `;
    }

    addButtonClicked() {
        this.addItem();
        if (this.inputRef.value) {
            this.inputRef.value.focus();
        }
    }

    addItem() {
        let trimmedValue = this.value.trim();
        if (trimmedValue && !this.items.includes(trimmedValue) && trimmedValue !== ",") {

            // Are we a URL type? Ensure it starts with http:// or https://.
            if (this.type === "url") {
                var trimmedValueLower = trimmedValue.toLowerCase();
                if (!trimmedValueLower.startsWith("https://") && !trimmedValueLower.startsWith("http://")) {
                    trimmedValue = "https://" + trimmedValue;
                }
            }

            this.mutateItems(() => this.items.push(trimmedValue));
        }

        this.clearInput();
    }

    removeItem(item: string): void {
        const removedItemIndex = this.items.indexOf(item);
        if (removedItemIndex !== -1) {
            this.mutateItems(() => this.items.splice(removedItemIndex, 1));
        }
    }

    renderItems(): TemplateResult {
        if (!this.items || this.items.length === 0) {
            return html``;
        }

        return html`
            <ul class="list-group mt-3">
                ${repeat(this.items, l => l, l => this.renderItem(l))}
            </ul>
        `;
    }

    renderHelpText(): TemplateResult {
        if (!this.help || this.items.length > 0) {
            return html``;
        }

        return html`
            <div id="help-text-${this.id}" class="form-text">
                <span class="text-muted">${this.help}</span>
            </div>
        `;
    }

    renderItem(item: string): TemplateResult {
        const isLink = item && item.startsWith("https://");
        const text = isLink ? item.replace("https://", "") : item;
        const textContent = html`<span class="text-break">${text}</span>`;
        const content = isLink ?
            html`<a href="${item}" target="_blank">${textContent}</a>` :
            textContent;
        return html`
            <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                ${content}
                <button type="button" class="btn-close" aria-label="Close" @click="${() => this.removeItem(item)}" title="${this.itemTooltip}"></button>
            </li>
        `;
    }

    handleKeyDown(e: KeyboardEvent): void {
        const isAddKey = e.key === "," || e.code === "Enter";
        if (isAddKey) {
            this.addItem();
            e.preventDefault();
        }
    }

    clearInput(): void {
        this.value = "";
        const inputElement = this.inputRef.value as HTMLInputElement;
        if (inputElement) {
            inputElement.value = "";
        }
    }

    inputChanged(): void {
        this.addItem();
    }

    mutateItems(mutator: () => void) {
        mutator();
        this.requestUpdate();
    }
}
