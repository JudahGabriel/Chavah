import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

@customElement("donate-cancelled-page")
export class DonateCancelledPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private ready = true;

  render() {
    return html`
      <section class="page donate-page">
        <div class="row">
          <div class="col-xs-12 col-sm-8 col-lg-6 col-sm-offset-2 col-lg-offset-3">
            <h2 class="text-warning"><wa-icon name="ban"></wa-icon> Donation cancelled</h2>
            <p>
              You cancelled the donation. No worries! Thanks for considering it anyways. If you change your mind, head
              over to the <a href="/donate">donate page</a>.
            </p>
            <p>Having trouble donating? Feel free to <a href="/support">contact us</a>.</p>
            <wa-button variant="brand" href="/">Take me back to the music</wa-button>
            ${this.ready && this.params ? nothing : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
