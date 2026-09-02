import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Social sharing thank-you page. Ported from `views/ShareThanks.html` + `ShareThanksController`.
 */
@customElement("share-thanks-page")
export class ShareThanksPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  private get artist(): string | undefined {
    return this.params.artist;
  }

  private get donateUrl(): string {
    return this.artist ? `/donate/${encodeURIComponent(this.artist)}` : "/donate";
  }

  private get donateText(): string {
    return this.artist ? `Donate to ${this.artist}` : "Donate to the artists";
  }

  render() {
    return html`
      <section class="page share-thanks-page">
        <div style="max-width: 800px; margin: 0 auto;">
          <br />
          <h1><wa-icon name="hand-spock"></wa-icon> You're a mentsh!</h1>
          <h4>Thanks for spreading Messiah's music on the web. (◕‿◕✿)</h4>
          <p>
            Want to help even more? <a href=${this.donateUrl}>${this.donateText}</a> to amplify and increase Messiah's
            music.
          </p>
          <!-- The old Facebook page embed loaded the Facebook SDK; omitted to avoid injecting external scripts. -->
        </div>
      </section>
    `;
  }
}

