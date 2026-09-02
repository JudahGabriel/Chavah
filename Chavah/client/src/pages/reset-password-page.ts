import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import type { ResetPasswordResult } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

@customElement("reset-password-page")
export class ResetPasswordPage extends LitElement {
  private static readonly regexContainsLetterAndNumber = /^(?=.*[a-zA-Z])(?=.*[0-9])/;

  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  @state() private email = "";
  @state() private password = "";
  @state() private confirmCode = "";
  @state() private showPasswordError = false;
  @state() private isBusy = false;
  @state() private passwordResetSucccessful = false;
  @state() private passwordResetFailed = false;
  @state() private passwordResetFailedMessage = "";

  connectedCallback(): void {
    super.connectedCallback();
    this.email = this.params.email ? decodeURIComponent(this.params.email) : "";
    const escapedConfirmCode = this.params.confirmCode ? decodeURIComponent(this.params.confirmCode) : "";
    this.confirmCode = escapedConfirmCode.replace(/___/g, "/");
  }

  private get isValidPassword(): boolean {
    return (
      !!this.password &&
      this.password.length >= 6 &&
      ResetPasswordPage.regexContainsLetterAndNumber.test(this.password)
    );
  }

  private get showChangePasswordForm(): boolean {
    return !this.passwordResetSucccessful && !this.passwordResetFailed;
  }

  private changePassword(e: Event): void {
    e.preventDefault();
    if (!this.isValidPassword) {
      this.showPasswordError = true;
      return;
    }

    if (!this.isBusy) {
      this.resetValidationStates();
      this.isBusy = true;
      accountService
        .resetPassword(this.email, this.confirmCode, this.password)
        .then((results) => this.passwordResetCompleted(results))
        .finally(() => (this.isBusy = false));
    }
  }

  private passwordResetCompleted(result: ResetPasswordResult): void {
    if (result.success) {
      this.passwordResetSucccessful = true;
    } else {
      this.passwordResetFailed = true;
      this.passwordResetFailedMessage = result.errorMessage;
    }
  }

  private resetValidationStates(): void {
    this.passwordResetFailed = false;
    this.passwordResetFailedMessage = "";
    this.passwordResetSucccessful = false;
    this.showPasswordError = false;
  }

  render() {
    return html`
      <section class="page reset-password-page account-page">
        <div class="account-form">
          ${this.showChangePasswordForm
            ? html`
                <h1>Type a new password</h1>
                <form @submit=${(e: Event) => this.changePassword(e)}>
                  <wa-input
                    type="password"
                    label="New password"
                    placeholder="Your new password"
                    password-toggle
                    .value=${this.password}
                    @input=${(e: Event) => {
                      this.password = (e.target as HTMLInputElement).value;
                      this.showPasswordError = false;
                    }}
                  ></wa-input>
                  ${!this.isValidPassword && this.showPasswordError
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        Passwords must be at least 6 characters and contain both letters and numbers.
                      </wa-callout>`
                    : nothing}
                  <br />
                  <wa-button type="submit" variant="brand" style="width: 100%;" ?disabled=${this.isBusy}>
                    <wa-icon slot="start" name="lock"></wa-icon>
                    Change password
                  </wa-button>
                </form>
              `
            : nothing}

          ${this.passwordResetSucccessful
            ? html`
                <h3>
                  <wa-icon name="circle-check" style="color: var(--wa-color-success-fill-loud);"></wa-icon>
                  Your password has been changed.
                </h3>
                <p>You may now <a href="/signin"><wa-icon name="right-to-bracket"></wa-icon> sign in</a>.</p>
              `
            : nothing}

          ${this.passwordResetFailed
            ? html`
                <h3>
                  <wa-icon name="circle-exclamation" style="color: var(--wa-color-danger-fill-loud);"></wa-icon>
                  Uh oh. We were unable to change your password.
                </h3>
                ${this.passwordResetFailedMessage ? html`<p>${this.passwordResetFailedMessage}</p>` : nothing}
                <p>
                  You can try <a href="/forgotpassword">resetting your password</a> again. If the problem persists,
                  please <a href="/support">contact us</a>.
                </p>
              `
            : nothing}
        </div>
      </section>
    `;
  }
}

