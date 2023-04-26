import { RouterLocation } from "@vaadin/router";
import { TemplateResult } from "lit";
import { BootstrapBase } from "../common/bootstrap-base";
export declare class ChordEditSuccessful extends BootstrapBase {
    location: RouterLocation | null;
    static get styles(): import("lit").CSSResultGroup[];
    render(): TemplateResult;
    renderReturnLink(): TemplateResult;
}
