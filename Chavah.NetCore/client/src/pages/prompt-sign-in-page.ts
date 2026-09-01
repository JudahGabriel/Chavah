import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

/**
 * Shown when an anonymous user tries to do something that requires an account
 * (thumb up/down, request a song, submit lyrics, etc.). Ported from
 * `views/PromptSignIn.html`.
 */
@customElement("prompt-sign-in-page")
export class PromptSignInPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <section class="page account-page prompt-sign-in-page">
        <div class="account-form">
          <h3>
            <wa-icon name="circle-info" style="color: var(--wa-color-brand-fill-loud);"></wa-icon>
            You need to sign in
          </h3>
          <p style="color: var(--wa-color-neutral-fill-loud);">
            Glad you're enjoying Chavah! But only signed in users can thumb up/down songs, request songs,
            submit lyrics, and more.
          </p>

          <br />
          <wa-button variant="brand" href="/signin" style="width: 100%;">
            <wa-icon slot="start" name="right-to-bracket"></wa-icon> Sign in
          </wa-button>
          <br />
          <hr />
          <h4>Don't have an account yet?</h4>
          <wa-button appearance="outlined" href="/register">
            <wa-icon slot="start" name="user-plus"></wa-icon> Create account
          </wa-button>
        </div>
      </section>
    `;
  }
}

