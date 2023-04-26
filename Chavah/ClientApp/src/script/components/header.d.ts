import { TemplateResult } from 'lit';
import { BootstrapBase } from '../common/bootstrap-base';
export declare class AppHeader extends BootstrapBase {
    static get styles(): import("lit").CSSResultGroup[];
    locationPath: string;
    isOnline: boolean;
    hideOfflineAlert: boolean;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    listenForOfflineStatusChange(): Promise<void>;
    routeChanged(e: CustomEvent): void;
    get isOnHomePage(): boolean;
    render(): TemplateResult<1>;
    renderLargeSubheader(): TemplateResult;
    renderPhoneSubheader(): TemplateResult;
    renderOfflineStatus(): TemplateResult;
}
