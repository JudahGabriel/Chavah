import { TemplateResult } from 'lit';
import { BootstrapBase } from '../common/bootstrap-base';
import { PagedList } from '../models/paged-list';
export declare class LoadMoreButton extends BootstrapBase {
    list: PagedList<any> | null;
    static get styles(): import("lit").CSSResultGroup[];
    connectedCallback(): void;
    render(): TemplateResult;
    renderLoading(): TemplateResult;
    getNextChunk(): void;
}
