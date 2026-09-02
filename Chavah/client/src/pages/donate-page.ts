import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { artistApi } from "../services/artist-api-service";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";

@customElement("donate-page")
export class DonatePage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private donationTargetOptions: string[] = [];
  @state() private donationTarget = "Chavah Messianic Radio";

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeDonationTargets();
  }

  private initializeDonationTargets(): void {
    const options = ["Chavah Messianic Radio", "All artists on Chavah Messianic Radio"];
    const routeArtist = this.params.artist ? decodeURIComponent(this.params.artist) : "";
    if (routeArtist) {
      options.push(routeArtist);
      this.donationTarget = routeArtist;
    } else {
      this.donationTarget = options[0];
    }
    this.donationTargetOptions = options;

    artistApi.getAll("", 0, 1000).then((results) => {
      const artistNames = results.items.map((artist) => artist.name);
      this.donationTargetOptions = [...options, ...artistNames];
    });
  }

  private donationTargetChanged(e: Event): void {
    this.donationTarget = String((e.target as HTMLInputElement).value);
  }

  render() {
    return html`
      <section class="page donate-page">
        <div class="row">
          <div class="col-xs-12 col-sm-8 col-lg-6 col-sm-offset-2 col-lg-offset-3">
            <h1>Donate</h1>
            <p>
              Thanks for supporting Messiah's musicians! Many of the artists on Chavah rely on your donations, so thank
              you so much for your generosity.
            </p>
            <p>
              You can donate any amount, one-time or monthly. Your donation can support Chavah Messianic Radio, a
              particular artist, or all artists on Chavah.
            </p>

            <h4>
              My donation should be distributed to:
              <wa-select
                class="form-control"
                .value=${this.donationTarget}
                @input=${(e: Event) => this.donationTargetChanged(e)}
                @change=${(e: Event) => this.donationTargetChanged(e)}
              >
                ${this.donationTargetOptions.map(
                  (target) => html`<wa-option value=${target}>${target}</wa-option>`,
                )}
              </wa-select>
            </h4>
            <br />

            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
              <input type="hidden" name="cmd" value="_donations" />
              <input type="hidden" name="business" value="judahgabriel@gmail.com" />
              <input type="hidden" name="lc" value="US" />
              <input type="hidden" name="item_name" value="Chavah Messianic Radio" />
              <input type="hidden" name="item_number" value=${`distribute to ${this.donationTarget}`} />
              <input type="hidden" name="no_note" value="0" />
              <input type="hidden" name="cn" value="Add a comment to Chavah Messianic Radio:" />
              <input type="hidden" name="no_shipping" value="1" />
              <input type="hidden" name="rm" value="1" />
              <input type="hidden" name="return" value="https://messianicradio.com/donatesuccess" />
              <input type="hidden" name="cancel_return" value="https://messianicradio.com/donatecancelled" />
              <input type="hidden" name="currency_code" value="USD" />
              <input type="hidden" name="bn" value="PP-DonationsBF:btn_donateCC_LG.gif:NonHosted" />
              <input type="hidden" name="artist" value="foobar" />
              <input
                type="image"
                src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
                border="0"
                name="submit"
                alt="PayPal - The safer, easier way to pay online!"
                style="border-width: 0;"
                uib-tooltip="This will take you to PayPal where you can specify the donation amount"
                tooltip-placement="right"
              />
              <img
                alt=""
                border="0"
                src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif"
                width="1"
                height="1"
              />
            </form>
            ${nothing}
          </div>
        </div>
      </section>
    `;
  }
}
