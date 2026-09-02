import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Song edit approval confirmation. Ported from `views/SongEditApproved.html` + `SongEditApprovedController`.
 */
@customElement("song-edit-approved-page")
export class SongEditApprovedPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  private get artist(): string {
    return decodeURIComponent(this.params.artist ?? "");
  }

  private get songName(): string {
    return decodeURIComponent(this.params.songName ?? "");
  }

  render() {
    return html`
      <section class="page song-edit-approved-page">
        <div style="max-width: 800px; margin: 0 auto;">
          <wa-card style="padding: 100px;">
            <h1><wa-icon name="circle-check"></wa-icon> Your song edit has been approved</h1>
            <p>
              Good news! Your song edit has been approved. The lyrics and tags for
              <strong>${this.artist} - ${this.songName}</strong> is now live for all listeners to see and enjoy. Chavah
              gives you her thanks! (✿◠‿◠)
            </p>
            <p>
              <wa-button variant="brand" href="/">Return to the music</wa-button>
            </p>
          </wa-card>
        </div>
      </section>
    `;
  }
}

