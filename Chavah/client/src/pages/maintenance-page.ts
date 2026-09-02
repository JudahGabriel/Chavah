import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Maintenance page. Ported from `views/Maintenance.html`.
 */
@customElement("maintenance-page")
export class MaintenancePage extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <section class="page maintenance-page">
        <div style="max-width: 800px; margin: 0 auto;">
          <wa-card style="padding: 30px;">
            <h2>
              <wa-icon name="triangle-exclamation"></wa-icon> Chavah is down
              <a href="https://www.shabot6000.com" style="float: left; margin-right: 20px;">
                <img
                  src="/images/maintenance.png"
                  style="height: 250px;"
                  class="img-responsive"
                  alt="Chavah is down for maintenance"
                  title="Courtesy Ben Baruch, Shabot6000.com"
                />
              </a>
            </h2>
            <p>
              We'll be back online soon. For more updates, check
              <a href="https://twitter.com/messianicradio" target="_blank" rel="noopener">Chavah's Twitter feed</a>.
            </p>
            <div style="clear: both;"></div>
          </wa-card>
        </div>
      </section>
    `;
  }
}

