import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import type { ResetPasswordResult } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

@customElement("forgot-password-page")
export class ForgotPasswordPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  @state() private email = "";
  @state() private pwned = false;
  @state() private resetPasswordSuccessfully = false;
  @state() private couldNotFindEmail = false;
  @state() private resetErrorMessage = "";
  @state() private isBusy = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.params.email) {
      this.email = decodeURIComponent(this.params.email);
    }
    this.pwned = !!this.params.pwned;
  }

  private get registerUrl(): string {
    if (this.email && this.email.indexOf("@") >= 0) {
      return `/register/${encodeURIComponent(this.email)}`;
    }

    return "/register";
  }

  private resetPassword(e: Event): void {
    e.preventDefault();
    const isValidEmail = !!this.email && this.email.includes("@");
    if (!isValidEmail) {
      this.resetErrorMessage = "Please enter your email so we can reset your password";
      return;
    }

    this.resetFields();

    if (!this.isBusy) {
      this.isBusy = true;
      accountService
        .sendPasswordResetEmail(this.email)
        .then((results) => this.passwordResetCompleted(results))
        .finally(() => (this.isBusy = false));
    }
  }

  private passwordResetCompleted(result: ResetPasswordResult): void {
    if (result.success) {
      this.resetPasswordSuccessfully = true;
    } else if (result.invalidEmail) {
      this.couldNotFindEmail = true;
    } else {
      this.resetErrorMessage = result.errorMessage || "Unable to reset password";
    }
  }

  private resetFields(): void {
    this.couldNotFindEmail = false;
    this.resetPasswordSuccessfully = false;
    this.resetErrorMessage = "";
  }

  render() {
    return html`
      <section class="page forgot-password-page account-page">
        <div class="account-form">
          ${!this.resetPasswordSuccessfully
            ? html`
                <h1>${this.pwned ? "Your password was discovered in data breaches?" : "Forgot your password?"}</h1>
                <p class="text-muted">No worries. Tell us your email and we'll reset your password.</p>
                <form @submit=${(e: Event) => this.resetPassword(e)}>
                  <wa-input
                    type="email"
                    label="Email"
                    placeholder="Your email address"
                    .value=${this.email}
                    @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)}
                  ></wa-input>
                  ${this.couldNotFindEmail
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        Hmm, it doesn't look like you're registered.
                        <br />
                        Do you want to
                        <a href=${this.registerUrl}>
                          <wa-icon name="user-plus"></wa-icon> create a new account
                        </a>
                        ?
                      </wa-callout>`
                    : nothing}
                  ${this.resetErrorMessage
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        ${this.resetErrorMessage}
                      </wa-callout>`
                    : nothing}
                  <br />
                  <wa-button type="submit" variant="brand" style="width: 100%;" ?disabled=${this.isBusy}>
                    <wa-icon slot="start" name="lock"></wa-icon>
                    Reset password
                  </wa-button>
                </form>
              `
            : html`
                <h3>
                  <wa-icon name="circle-check" style="color: var(--wa-color-success-fill-loud);"></wa-icon>
                  Password reset email sent.
                </h3>
                <p>Please <strong>check your email</strong> and click the link to finish resetting your password.</p>
              `}
        </div>
      </section>
    `;
  }
}

