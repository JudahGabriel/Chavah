import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';

@customElement('app-footer')
export class AppFooter extends BootstrapBase {
    static get styles() {
        const localStyles = css`
            :host {
                font-family: var(--subtitle-font);
            }

            a {
                color: var(--theme-color);
                text-decoration: none;
            }
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    render() {
        return html`
            <footer class="w-100 pb-5 mt-3 mb-2 d-print-none">
                <div class="text-center">
                    <a href="/">Home</a>
                    <span class="bar-separator">|</span>
                    <a href="/about">About us, legal</a>
                    <span class="bar-separator">|</span>
                    <a href="https://blog.judahgabriel.com/2012/01/introducing-messianicchordscom.html">What is this site?</a>
                    <span class="bar-separator">|</span>
                    <a href="https://blog.judahgabriel.com">Author's Blog</a>
                    <span class="bar-separator">|</span>
                    <a href="https://messianicradio.com">Chavah Messianic Radio</a>
                </div>
            </footer>
        `;
    }
}