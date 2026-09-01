import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("password-page")
export class PasswordPage extends LitElement {
  createRenderRoot() { return this; }
  render() { return html`<p>Password (coming soon)</p>`; }
}
