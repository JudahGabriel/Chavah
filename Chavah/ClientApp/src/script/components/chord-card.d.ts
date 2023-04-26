import { CSSResultGroup } from 'lit';
import { BootstrapBase } from '../common/bootstrap-base';
import { ChordSheet } from '../models/interfaces';
export declare class ChordCard extends BootstrapBase {
    chord: ChordSheet | null;
    static get styles(): CSSResultGroup;
    constructor();
    render(): import("lit-html").TemplateResult<1>;
    renderHebrewName(): import("lit-html").TemplateResult<1>;
    renderKey(): import("lit-html").TemplateResult<1>;
}
