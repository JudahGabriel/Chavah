import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("sign-in-page")
export class SignInPage extends LitElement {
  createRenderRoot() { return this; }
  render() { return html`<p>Sign in (coming soon)</p>`; }
}
