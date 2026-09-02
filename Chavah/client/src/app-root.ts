import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import "./components/chavah-header";
import "./components/chavah-footer";

@customElement("chavah-app")
export class ChavahApp extends LitElement {
  // Light DOM so global.css + page components style normally and the router can
  // place page elements into the outlet without shadow-boundary friction.
  createRenderRoot() { return this; }

  render() {
    return html`
      <chavah-header></chavah-header>
      <main id="currentPageContainer"></main>
      <chavah-footer></chavah-footer>
    `;
  }
}
