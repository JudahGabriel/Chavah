import { TemplateResult } from 'lit';
import { BootstrapBase } from '../common/bootstrap-base';
export declare class MultipleItemsInput extends BootstrapBase {
    id: string;
    items: string[];
    placeholder: string;
    ariaLabel: string;
    help: string;
    value: string;
    addLabel: string;
    addTooltip: string;
    itemTooltip: string;
    inputId: string;
    invalid: string | null | undefined;
    type: "text" | "url" | undefined;
    inputRef: import("lit-html/directives/ref").Ref<HTMLInputElement>;
    static get styles(): import("lit").CSSResultGroup[];
    render(): TemplateResult;
    addButtonClicked(): void;
    addItem(): void;
    removeItem(item: string): void;
    renderItems(): TemplateResult;
    renderHelpText(): TemplateResult;
    renderItem(item: string): TemplateResult;
    handleKeyDown(e: KeyboardEvent): void;
    clearInput(): void;
    inputChanged(): void;
    mutateItems(mutator: () => void): void;
}
