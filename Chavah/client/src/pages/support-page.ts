import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";

type SupportState = "unsubmitted" | "success" | "error";

/**
 * Support contact page. Ported from `views/Support.html` + `SupportController`.
 */
@customElement("support-page")
export class SupportPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state() private name = "";
  @state() private email = "";
  @state() private message = "";
  @state() private isSaving = false;
  @state() private state: SupportState = "unsubmitted";

  constructor() {
    super();
    this.email = accountService.currentUser?.email ?? "";
  }

  private get canSubmit(): boolean {
    return !this.isSaving && this.message.length > 0 && this.email.length > 0 && this.name.length > 0;
  }

  private submit(e: Event): void {
    e.preventDefault();
    if (!this.canSubmit) {
      return;
    }

    this.isSaving = true;
    accountService
      .sendSupportMessage(this.name, this.email, this.message, navigator.userAgent)
      .then(
        () => (this.state = "success"),
        () => (this.state = "error"),
      )
      .finally(() => (this.isSaving = false));
  }

  private updateName(e: Event): void {
    this.name = (e.target as HTMLInputElement).value;
  }

  private updateEmail(e: Event): void {
    this.email = (e.target as HTMLInputElement).value;
  }

  private updateMessage(e: Event): void {
    this.message = (e.target as HTMLTextAreaElement).value;
  }

  render() {
    return html`
      <section class="page support-page">
        <div style="max-width: 800px; margin: 0 auto;">
          ${this.state === "success" ? this.renderSuccess() : this.state === "error" ? this.renderError() : this.renderForm()}
        </div>
      </section>
    `;
  }

  private renderForm() {
    return html`
      <wa-card>
        <h2><wa-icon name="circle-info"></wa-icon> Chavah Support</h2>
        <p class="text-muted">Need help? Hitting an issue? Questions, comments, or feedback? We're listening.</p>
        <form @submit=${(e: Event) => this.submit(e)}>
          <wa-input
            type="text"
            label="Name"
            placeholder="Your name"
            .value=${this.name}
            @input=${(e: Event) => this.updateName(e)}
          ></wa-input>
          <br />
          <wa-input
            type="email"
            label="Email address"
            placeholder="Your email"
            .value=${this.email}
            @input=${(e: Event) => this.updateEmail(e)}
          ></wa-input>
          <br />
          <wa-textarea
            label="Message"
            rows="5"
            placeholder="Type your message"
            .value=${this.message}
            @input=${(e: Event) => this.updateMessage(e)}
          ></wa-textarea>
          <br />
          <wa-button type="submit" variant="brand" ?disabled=${!this.canSubmit}>Submit</wa-button>
        </form>
      </wa-card>
    `;
  }

  private renderSuccess() {
    return html`
      <wa-card>
        <h2><wa-icon name="circle-check"></wa-icon> Message received</h2>
        <p>Chavah will follow up with you by email. Thanks for reaching out.</p>
        <p>
          <wa-button variant="brand" href="/">
            <wa-icon slot="start" name="circle-arrow-left"></wa-icon>
            Take me back to the music
          </wa-button>
        </p>
      </wa-card>
    `;
  }

  private renderError() {
    return html`
      <wa-card>
        <h2><wa-icon name="circle-exclamation"></wa-icon> Unable to reach Chavah support</h2>
        <p>
          There seems to be a problem. Please email us directly:
          <a href="mailto:chavah@messianicradio.com">chavah@messianicradio.com</a>
        </p>
        <p>
          <wa-button variant="brand" href="/">
            <wa-icon slot="start" name="circle-arrow-left"></wa-icon>
            Take me back to the music
          </wa-button>
        </p>
      </wa-card>
    `;
  }
}

