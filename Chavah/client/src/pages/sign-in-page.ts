import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import { appNav } from "../services/app-nav-service";
import type { User as ServerUser } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

/**
 * Step 1 of sign-in: collect the user's email, look it up, then route to the
 * password page (or to create-password when a reset is required, or show a
 * "no such user" prompt). Ported from `views/SignIn.html` + `SignInController`.
 */
@customElement("sign-in-page")
export class SignInPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state() private email = "";
  @state() private showEmailError = false;
  @state() private showUserNotInSystem = false;
  @state() private isBusy = false;

  private get registerUrl(): string {
    if (this.email && this.email.indexOf("@") >= 0) {
      return `/register/${encodeURIComponent(this.email)}`;
    }
    return "/register";
  }

  private emailChanged(e: Event): void {
    this.email = (e.target as HTMLInputElement).value;
    this.showUserNotInSystem = false;
  }

  private checkEmail(e: Event): void {
    e.preventDefault();
    if (!this.email) {
      this.showEmailError = true;
    } else if (!this.isBusy) {
      this.showUserNotInSystem = false;
      this.showEmailError = false;
      this.isBusy = true;
      accountService
        .getUserWithEmail(this.email)
        .then((result) => this.userFetched(result))
        .finally(() => (this.isBusy = false));
    }
  }

  private userFetched(user: ServerUser | null): void {
    if (user == null) {
      this.showUserNotInSystem = true;
    } else if (user.requiresPasswordReset) {
      appNav.createPassword(this.email);
    } else {
      appNav.password(this.email);
    }
  }

  render() {
    return html`
      <section class="page sign-in-page account-page">
        <div class="account-form">
          <h1 class="text-center"><wa-icon name="right-to-bracket"></wa-icon> Sign in</h1>
          <p class="text-center" style="color: var(--wa-color-neutral-fill-loud);">
            Signing in lets you thumb-up songs, request songs, chat with other Chavah listeners, and more.
          </p>
          <br />
          <div class="text-center">
            <wa-icon name="circle-user" class="user-profile-icon"></wa-icon>
          </div>
          <br />
          <form @submit=${(e: Event) => this.checkEmail(e)}>
            <wa-input
              type="email"
              placeholder="Enter your email"
              label="Email"
              .value=${this.email}
              @input=${(e: Event) => this.emailChanged(e)}
            ></wa-input>
            ${this.showEmailError && !this.email
              ? html`<wa-callout variant="danger" size="small">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  Please enter your email address.
                </wa-callout>`
              : nothing}
            ${this.showUserNotInSystem
              ? html`<wa-callout variant="brand" size="small">
                  <wa-icon slot="icon" name="circle-info"></wa-icon>
                  There's no user with that email address. Do you want to
                  <a href=${this.registerUrl}>create a new account</a>?
                </wa-callout>`
              : nothing}

            <br />
            <wa-button type="submit" variant="brand" style="width: 100%;" ?disabled=${this.isBusy}>
              <wa-icon slot="start" name="arrow-right"></wa-icon> Next
            </wa-button>
            <br />
            <br />
            <hr />
            <h4>New to Chavah?</h4>
            <wa-button appearance="outlined" href="/register">
              <wa-icon slot="start" name="user-plus"></wa-icon> Create account
            </wa-button>
          </form>
        </div>
      </section>
    `;
  }
}

