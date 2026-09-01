import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("chavah-header")
export class ChavahHeader extends LitElement {
  createRenderRoot() { return this; }
  render() { return html``; }
}
