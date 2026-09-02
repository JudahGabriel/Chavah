import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import type { IRegisterModel, IRegisterResults } from "../models/server-interfaces";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

@customElement("register-page")
export class RegisterPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  @state() private email = "";
  @state() private password = "";
  @state() private confirmPassword = "";
  @state() private showEmailError = false;
  @state() private showPasswordError = false;
  @state() private showRegisterSuccess = false;
  @state() private showAlreadyRegistered = false;
  @state() private showNeedsConfirmation = false;
  @state() private showPasswordIsPwned = false;
  @state() private registrationError = "";
  @state() private isBusy = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (this.params.email) {
      this.email = decodeURIComponent(this.params.email);
    }
  }

  private get isValidEmail(): boolean {
    return !!this.email && this.email.lastIndexOf("@") >= 0;
  }

  private get isValidPassword(): boolean {
    return !!this.password && this.password.length >= 6;
  }

  private get isMatchingPassword(): boolean {
    return this.isValidPassword && this.password !== this.confirmPassword;
  }

  private get showRegisterForm(): boolean {
    return !this.showAlreadyRegistered && !this.showNeedsConfirmation && !this.showRegisterSuccess;
  }

  private register(e: Event): void {
    e.preventDefault();
    this.reset();

    if (!this.isValidEmail) {
      this.showEmailError = true;
      return;
    }
    if (!this.isValidPassword) {
      this.showPasswordError = true;
      return;
    }

    if (!this.isBusy) {
      this.isBusy = true;
      const registerModel: IRegisterModel = {
        email: this.email,
        password: this.password,
        confirmPassword: this.password,
      };

      accountService
        .register(registerModel)
        .then((results) => this.registrationCompleted(results))
        .finally(() => (this.isBusy = false));
    }
  }

  private registrationCompleted(results: IRegisterResults): void {
    if (results.success) {
      this.showRegisterSuccess = true;
    } else if (results.needsConfirmation) {
      this.showNeedsConfirmation = true;
    } else if (results.isAlreadyRegistered) {
      this.showAlreadyRegistered = true;
    } else if (results.isPwned) {
      this.showPasswordIsPwned = true;
    } else {
      this.registrationError = results.errorMessage || "Unable to register your user. Please contact judahgabriel@gmail.com";
    }
  }

  private reset(): void {
    this.registrationError = "";
    this.showAlreadyRegistered = false;
    this.showEmailError = false;
    this.showNeedsConfirmation = false;
    this.showPasswordError = false;
    this.showRegisterSuccess = false;
    this.showPasswordIsPwned = false;
  }

  render() {
    return html`
      <section class="page register-page account-page">
        <div class="account-form">
          ${this.showRegisterForm
            ? html`
                <h1 class="text-center"><wa-icon name="user-plus"></wa-icon> Register a new account</h1>
                <p class="text-center text-muted">To register, enter your email address and a new password.</p>
                <p class="text-center text-muted">Already registered? Go to <a href="/signin">sign in</a>.</p>

                <form @submit=${(e: Event) => this.register(e)}>
                  <wa-input
                    type="email"
                    label="Email"
                    placeholder="Enter your email"
                    .value=${this.email}
                    @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)}
                  ></wa-input>
                  ${this.showEmailError && !this.isValidEmail
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        Please enter your email address.
                      </wa-callout>`
                    : nothing}

                  <wa-input
                    type="password"
                    label="Password"
                    placeholder="Enter a new password"
                    password-toggle
                    .value=${this.password}
                    @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)}
                  ></wa-input>
                  ${this.showPasswordError && !this.isValidPassword
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        Please enter a password. The password must be at least 6 characters long and contain letters
                        and numbers.
                      </wa-callout>`
                    : nothing}

                  <wa-input
                    type="password"
                    label="Confirm password"
                    placeholder="Confirm password"
                    password-toggle
                    .value=${this.confirmPassword}
                    @input=${(e: Event) => (this.confirmPassword = (e.target as HTMLInputElement).value)}
                  ></wa-input>
                  ${this.isMatchingPassword
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        The password doesn't match.
                      </wa-callout>`
                    : nothing}

                  ${this.registrationError
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        ${this.registrationError}
                      </wa-callout>`
                    : nothing}

                  <br />
                  <wa-button type="submit" variant="brand" style="width: 100%;" ?disabled=${this.isBusy}>
                    <wa-icon slot="start" name="user-plus"></wa-icon>
                    Register
                  </wa-button>
                </form>
              `
            : nothing}

          ${this.showRegisterSuccess
            ? html`
                <h3>
                  <wa-icon name="circle-check" style="color: var(--wa-color-success-fill-loud);"></wa-icon>
                  OK! You're registered.
                </h3>
                <p>
                  <strong>Now, check your email.</strong> Click the link in the email we just sent you to confirm your
                  account.
                </p>
              `
            : nothing}

          ${this.showNeedsConfirmation
            ? html`
                <h3>
                  <wa-icon name="circle-info" style="color: var(--wa-color-brand-fill-loud);"></wa-icon>
                  You're already registered, but <strong>you need to confirm your account</strong>.
                </h3>
                <small>To confirm your account, click the link in the email we sent you.</small>
              `
            : nothing}

          ${this.showAlreadyRegistered
            ? html`
                <h3>
                  <wa-icon name="circle-info" style="color: var(--wa-color-brand-fill-loud);"></wa-icon>
                  Woops, you're alredy registered. Go to <a href="/signin">sign in</a>.
                </h3>
              `
            : nothing}

          ${this.showPasswordIsPwned
            ? html`
                <h3>
                  <wa-icon name="circle-exclamation" style="color: var(--wa-color-danger-fill-loud);"></wa-icon>
                  Please use a different password.
                </h3>
                <p>
                  The password you entered has been used elsewhere on the web. (<a
                    href="https://haveibeenpwned.com/Passwords"
                    target="_blank"
                    rel="noopener noreferrer"
                    >How do you know?</a
                  >)
                </p>
                <p>
                  <small class="text-muted"
                    >Tired of remembering passwords? Use a password manager like
                    <a href="https://www.lastpass.com/" rel="noopener noreferrer">LastPass</a>.</small
                  >
                </p>
              `
            : nothing}
        </div>
      </section>
    `;
  }
}

