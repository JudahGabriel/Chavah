import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import { appNav } from "../services/app-nav-service";
import { SignInStatus } from "../models/sign-in-status";
import type { ISignInResult } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";

/**
 * Step 2 of sign-in: the user's email is known, collect the password and sign
 * in. Handles the various sign-in outcomes (locked out, needs verification,
 * bad password, pwned password). Ported from `views/Password.html` +
 * `PasswordController`.
 */
@customElement("password-page")
export class PasswordPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  // Populated by the router from the `/password/:email` route param.
  params?: { email: string };

  @state() private password = "";
  @state() private staySignedIn = true;
  @state() private isBusy = false;
  @state() private signInSuccessful = false;
  @state() private showPasswordError = false;
  @state() private passwordError = "";
  @state() private showResendConfirmEmail = false;
  @state() private sendConfirmationEmailState: "none" | "sending" | "sent" = "none";

  private get email(): string {
    return this.params?.email ? decodeURIComponent(this.params.email) : "";
  }

  private get isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  private passwordChanged(e: Event): void {
    this.password = (e.target as HTMLInputElement).value;
    this.showPasswordError = false;
    this.passwordError = "";
  }

  private signIn(e: Event): void {
    e.preventDefault();
    if (!this.isPasswordValid) {
      this.showPasswordError = true;
      this.passwordError = "Passwords must be at least 6 characters long.";
      return;
    }

    if (!this.isBusy) {
      this.isBusy = true;
      accountService
        .signIn({ email: this.email, password: this.password, staySignedIn: this.staySignedIn })
        .then(
          (result) => this.signInCompleted(result),
          (error) => this.signInErred(error),
        )
        .finally(() => (this.isBusy = false));
    }
  }

  private signInCompleted(result: ISignInResult): void {
    if (result.status === SignInStatus.Success) {
      this.signInSuccessful = true;
      window.setTimeout(() => appNav.nowPlaying(), 2000);
    } else if (result.status === SignInStatus.LockedOut) {
      this.showPasswordError = true;
      this.passwordError = "Your account is locked out. Please contact judahgabriel@gmail.com";
    } else if (result.status === SignInStatus.RequiresVerification) {
      this.showPasswordError = true;
      this.passwordError =
        "Please check your email. We've sent you an email with a link to confirm your account.";
      this.showResendConfirmEmail = true;
    } else if (result.status === SignInStatus.Failure) {
      this.showPasswordError = true;
      this.passwordError = "Incorrect password";
    } else if (result.status === SignInStatus.Pwned) {
      this.showPasswordError = true;
      this.passwordError =
        result.errorMessage ||
        "Select a different password because the password you chose has appeared in a data breach";
      window.setTimeout(() => appNav.resetPwnedPassword(this.email), 4000);
    }
  }

  private signInErred(error: unknown): void {
    this.showPasswordError = true;
    this.passwordError =
      "There was a problem signing in. If the problem keeps happening, email us: chavah@messianicradio.com. Error details: " +
      (error && (error as { toString?: () => string }).toString
        ? (error as { toString: () => string }).toString()
        : "[null]");
  }

  private sendConfirmationEmail(): void {
    this.sendConfirmationEmailState = "sending";
    accountService.resendConfirmationEmail(this.email).then(() => (this.sendConfirmationEmailState = "sent"));
  }

  render() {
    if (this.signInSuccessful) {
      return html`
        <section class="page password-page account-page">
          <div class="account-form">
            <h3>
              <wa-icon name="circle-check" style="color: var(--wa-color-success-fill-loud);"></wa-icon>
              You're signed in!
            </h3>
            <p>
              <wa-spinner></wa-spinner> Redirecting you to <a href="/">home</a>...
            </p>
          </div>
        </section>
      `;
    }

    return html`
      <section class="page password-page account-page">
        <div class="account-form">
          <h1 class="text-center"><wa-icon name="right-to-bracket"></wa-icon> Sign in</h1>
          <p class="text-center" style="color: var(--wa-color-neutral-fill-loud);">
            Signing in lets you thumb-up songs, request songs, chat with other Chavah listeners, and more.
          </p>
          <br />
          <div class="text-center">
            <wa-icon name="circle-user" class="user-profile-icon"></wa-icon>
          </div>
          <p class="text-center"><strong>${this.email}</strong></p>
          <form @submit=${(e: Event) => this.signIn(e)}>
            <wa-input
              type="password"
              placeholder="Password"
              label="Password"
              password-toggle
              .value=${this.password}
              @input=${(e: Event) => this.passwordChanged(e)}
            ></wa-input>
            ${this.showPasswordError
              ? html`<wa-callout variant="danger" size="small">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  ${this.passwordError}
                  ${this.showResendConfirmEmail
                    ? html`<div>
                        ${this.sendConfirmationEmailState === "none"
                          ? html`<a href="javascript:void(0)" @click=${() => this.sendConfirmationEmail()}>
                              <wa-icon name="envelope"></wa-icon> Resend it
                            </a>`
                          : nothing}
                        ${this.sendConfirmationEmailState === "sending"
                          ? html`<span><wa-spinner></wa-spinner> Sending...</span>`
                          : nothing}
                        ${this.sendConfirmationEmailState === "sent"
                          ? html`<span style="color: var(--wa-color-success-fill-loud);">
                              <wa-icon name="circle-check"></wa-icon> We've resent the confirmation email
                            </span>`
                          : nothing}
                      </div>`
                    : nothing}
                </wa-callout>`
              : nothing}
            <br />
            <wa-button type="submit" variant="brand" style="width: 100%;" ?disabled=${this.isBusy}>
              Sign in
            </wa-button>
            <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
              <wa-checkbox
                ?checked=${this.staySignedIn}
                @input=${(e: Event) => (this.staySignedIn = (e.target as HTMLInputElement).checked)}
                >Stay signed in</wa-checkbox
              >
              <a href="/forgotpassword">Forgot password?</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }
}

