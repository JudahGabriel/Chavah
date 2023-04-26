import { ElementPart } from 'lit';
import { Directive, PartInfo } from 'lit/directive.js';
declare class FocusOnInvalidDirective extends Directive {
    /**
     *
     */
    constructor(partInfo: PartInfo);
    render(): string;
    update(part: ElementPart): unknown;
}
export declare const focusOnInvalid: () => import("lit-html/directive").DirectiveResult<typeof FocusOnInvalidDirective>;
export {};
