import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("prompt-sign-in-page")
export class PromptSignInPage extends LitElement {
  createRenderRoot() { return this; }
  render() { return html`<p>Prompt sign in (coming soon)</p>`; }
}
