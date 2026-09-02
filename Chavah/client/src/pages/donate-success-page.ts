import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

@customElement("donate-success-page")
export class DonateSuccessPage extends LitElement {
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
            <h2><wa-icon name="check" class="text-success"></wa-icon> Donation received</h2>
            <p>
              You're a mentsh! <wa-icon name="face-smile"></wa-icon> Thank you for supporting Messiah's musicians;
              we're sincerely grateful. Blessings to you from all the Chavah Messianic Radio family.
            </p>
            <wa-button variant="brand" href="/">Take me to the music</wa-button>
            ${this.ready && this.params ? nothing : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
