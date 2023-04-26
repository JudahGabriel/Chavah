import { RouterLocation } from "@vaadin/router";
import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { BootstrapBase } from "../common/bootstrap-base";

@customElement('chord-edit-successful')
export class ChordEditSuccessful extends BootstrapBase {
    location: RouterLocation | null = null; // injected by the router

    static get styles() {
        const localStyles = css`
            h1 {
                font-family: var(--subtitle-font);
                color: var(--theme-color);
            }
        `;
        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    render(): TemplateResult {
        return html`
            <div class="row">
                <div class="col-12 col-lg-6 offset-lg-3">
                    <div class="p-5 mb-4 bg-light rounded-3">
                        <div class="container-fluid py-5">
                            <h1 class="display-5 fw-bold">
                                ✔
                                Submission successful (✿◠‿◠)
                            </h1>
                            <p class="col-md-8 fs-4">Thank you! We'll review your submission soon.</p>
                            ${this.renderReturnLink()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderReturnLink(): TemplateResult {
        const id = this.location?.params["id"];
        if (id) {
            return html`<a class="btn btn-primary btn-lg" href="/chordsheets/${id}">Return to chord sheet</a>`
        }

        return html`<a class="btn btn-primary btn-lg" href="/">Return to home</a>`;
    }
}