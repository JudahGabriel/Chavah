import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import type { ConfirmEmailResult } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

@customElement("confirm-email-page")
export class ConfirmEmailPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  @state() private email = "";
  @state() private confirmCode = "";
  @state() private isConfirming = true;
  @state() private confirmSucceeded = false;
  @state() private confirmFailed = false;
  @state() private confirmFailedErrorMessage = "";

  private confirmTimer?: number;

  connectedCallback(): void {
    super.connectedCallback();
    this.email = this.params.email ? decodeURIComponent(this.params.email) : "";
    const escapedConfirmCode = this.params.confirmCode ? decodeURIComponent(this.params.confirmCode) : "";
    this.confirmCode = escapedConfirmCode.replace(/___/g, "/");
    this.confirmTimer = window.setTimeout(() => this.confirm(), 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.confirmTimer !== undefined) {
      window.clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }
  }

  private confirm(): void {
    accountService
      .confirmEmail(this.email, this.confirmCode)
      .then((results) => this.confirmEmailCompleted(results))
      .catch((error: unknown) =>
        this.confirmEmailCompleted({
          errorMessage: this.getConfirmErrorMessage(error),
          success: false,
        }),
      );
  }

  private confirmEmailCompleted(results: ConfirmEmailResult): void {
    this.isConfirming = false;
    this.confirmSucceeded = results.success;
    this.confirmFailed = !this.confirmSucceeded;
    this.confirmFailedErrorMessage = results.errorMessage;
  }

  private getConfirmErrorMessage(error: unknown): string {
    const data = (error as { data?: { exceptionMessage?: string } } | null)?.data;
    return data?.exceptionMessage || "Couldn't confirm email";
  }

  render() {
    return html`
      <section class="page confirm-email-page account-page">
        <div class="account-form">
          ${this.isConfirming
            ? html`
                <h1 class="text-center">
                  <wa-spinner></wa-spinner>
                  Confirming your email address...
                </h1>
              `
            : nothing}
          ${this.confirmSucceeded
            ? html`
                <h3>
                  <wa-icon name="circle-check" style="color: var(--wa-color-success-fill-loud);"></wa-icon>
                  Email confirmed.
                </h3>
                <p>You may now <a href="/signin">sign in</a>.</p>
              `
            : nothing}
          ${this.confirmFailed
            ? html`
                <h3>
                  <wa-icon name="circle-exclamation" style="color: var(--wa-color-danger-fill-loud);"></wa-icon>
                  Unable to confirm your account.
                </h3>
                <p>Please <a href="/support">contact us</a> for help.</p>
                ${this.confirmFailedErrorMessage
                  ? html`<p>Error details: ${this.confirmFailedErrorMessage}</p>`
                  : nothing}
              `
            : nothing}
        </div>
      </section>
    `;
  }
}

