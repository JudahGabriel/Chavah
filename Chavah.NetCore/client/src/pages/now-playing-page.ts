import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("now-playing-page")
export class NowPlayingPage extends LitElement {
  createRenderRoot() { return this; }
  render() { return html`<p>Now Playing (coming soon)</p>`; }
}
