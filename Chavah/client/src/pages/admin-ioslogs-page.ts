import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

interface WindowWithIosAudioPlayer extends Window {
  iosAudioPlayer?: { logs?: unknown[] };
}

@customElement("admin-ioslogs-page")
export class AdminIoslogsPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private iOSLogs = "";
  @state() private warningMessage = "";

  connectedCallback(): void {
    super.connectedCallback();
    this.refreshLogs();
  }

  private refreshLogs(): void {
    const logs = (window as WindowWithIosAudioPlayer).iosAudioPlayer?.logs;
    if (Array.isArray(logs)) {
      this.iOSLogs = logs.map((log) => String(log)).join("\r\r");
      this.warningMessage = "";
    } else {
      // The AngularJS page read IOSAudioPlayer.logs. That player is not part of the Lit client bundle, so show any
      // globally exposed native-player logs when present and otherwise fail gracefully.
      this.iOSLogs = "";
      this.warningMessage = "No iOS audio player logs are available in this browser session.";
    }
  }

  render() {
    return html`
      <section class="admin-page">
        <div class="admin-layout">
          <admin-sidebar active="ioslogs"></admin-sidebar>
          <div>
            <wa-button @click=${() => this.refreshLogs()}><wa-icon slot="start" name="arrows-rotate"></wa-icon>Refresh</wa-button>
            <br /><br />
            ${this.warningMessage
              ? html`<wa-callout variant="neutral"><wa-icon slot="icon" name="circle-info"></wa-icon>${this.warningMessage}</wa-callout>`
              : nothing}
            <wa-textarea rows="20" style="width: 100%;" .value=${this.iOSLogs} readonly></wa-textarea>
          </div>
        </div>
      </section>
    `;
  }
}
