import { ElementPart, noChange } from 'lit';
import { Directive, directive, PartInfo } from 'lit/directive.js';

// Lit directive that focuses the target element when the target element has a .is-invalid class applied.
// See https://lit.dev/docs/templates/custom-directives/ for Lit directives.
// See https://getbootstrap.com/docs/5.2/forms/validation/ for Bootstrap form validation and .is-invalid class.
class FocusOnInvalidDirective extends Directive {
    /**
     *
     */
    constructor(partInfo: PartInfo) {
        super(partInfo);
    }

    render(): string {
        return "";
    }

    update(part: ElementPart): unknown {
        const element = part.element as HTMLElement;
        if (element && element.classList.contains("is-invalid") && typeof element.focus === "function") {
            element.focus();
        }

        return noChange;
    }
}

export const focusOnInvalid = directive(FocusOnInvalidDirective);