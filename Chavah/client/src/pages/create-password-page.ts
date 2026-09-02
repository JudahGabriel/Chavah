import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

@customElement("create-password-page")
export class CreatePasswordPage extends LitElement {
  private static readonly regexContainsLetterAndNumber = /^(?=.*[a-zA-Z])(?=.*[0-9])/;

  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};

  @state() private email = "";
  @state() private emailWithoutDomain = "";
  @state() private password = "";
  @state() private showPasswordError = false;
  @state() private isSaving = false;
  @state() private hasCreatedPassword = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.email = this.params.email ? decodeURIComponent(this.params.email) : "";
    const atIndex = this.email.indexOf("@");
    this.emailWithoutDomain = atIndex >= 0 ? this.email.substring(0, atIndex) : this.email;
  }

  private get isPasswordValid(): boolean {
    return (
      !!this.password &&
      this.password.length >= 6 &&
      CreatePasswordPage.regexContainsLetterAndNumber.test(this.password)
    );
  }

  private createPassword(e: Event): void {
    e.preventDefault();
    if (!this.isPasswordValid) {
      this.showPasswordError = true;
      return;
    }

    if (!this.isSaving) {
      this.isSaving = true;
      accountService
        .createPassword(this.email, this.password)
        .then(() => (this.hasCreatedPassword = true))
        .finally(() => (this.isSaving = false));
    }
  }

  render() {
    return html`
      <section class="page create-password-page account-page">
        <div class="account-form">
          ${!this.hasCreatedPassword
            ? html`
                <h1><wa-icon name="lock"></wa-icon> Create a password</h1>
                <p class="text-muted">Welcome back, ${this.emailWithoutDomain}! Please create a password.</p>
                <form @submit=${(e: Event) => this.createPassword(e)}>
                  <wa-input
                    type="password"
                    label="Password"
                    placeholder="Password"
                    password-toggle
                    .value=${this.password}
                    @input=${(e: Event) => {
                      this.password = (e.target as HTMLInputElement).value;
                      this.showPasswordError = false;
                    }}
                  ></wa-input>
                  ${this.showPasswordError && !this.isPasswordValid
                    ? html`<wa-callout variant="danger" size="small">
                        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                        Please enter a password at least 6 characters long and contains both letters and numbers.
                      </wa-callout>`
                    : nothing}
                  <br />
                  <wa-button type="submit" variant="brand" style="width: 100%;" ?disabled=${this.isSaving}>
                    Create password
                  </wa-button>
                </form>
              `
            : html`
                <h1>
                  <wa-icon name="check" style="color: var(--wa-color-success-fill-loud);"></wa-icon>
                  Password created
                </h1>
                <p class="text-muted">You're ready to sign in with your new password.</p>
                <wa-button variant="brand" href="/signin">
                  <wa-icon slot="start" name="right-to-bracket"></wa-icon>
                  Sign in
                </wa-button>
              `}
        </div>
      </section>
    `;
  }
}

