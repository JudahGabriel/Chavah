import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';
import { SizeMax } from '../common/constants';

@customElement('app-header')
export class AppHeader extends BootstrapBase {
  static get styles() {
    const localStyles = css`

      header {
        padding: 20px;
      }

      @media (max-width: ${SizeMax.Xs}px) {
        header {
          padding-bottom: 0;
        }
      }

      img {
        margin: 5px 40px 5px 40px;
        box-shadow: 0 0 10px var(--theme-color);
        border-radius: 2px;
        width: 100px;
        height: 100px;
        transform: rotateZ(-2deg);
        transition: 0.2s linear transform;
      }

      img:hover {
        transform: rotateZ(4deg);
      }

      @media (max-width: ${SizeMax.Xs}px) {
        img {
          margin: 5px 10px 0 0;
          width: 50px;
          height: 50px;
        }
      }

      h1 {
        font-family: var(--title-font);
        font-size: 2.5em;
        display: block;
        margin-top: 7px;
        margin-bottom: 0;
        line-height: 65px;
        text-shadow: 1px 1px 7px silver;
      }

      @media (max-width: ${SizeMax.Xs}px) {
        h1 {
          margin-top: 0;
          margin-left: 20px;
          font-size: 1.5em;
        }
      }

      h1 a {
        text-decoration: none;
        color: var(--theme-color);
      }

      h2 {
        font-family: var(--subtitle-font);
        color: var(--theme-color);
        margin-top: -5px;
        font-size: 1em;
        background: var(--highlight-background);
        border-radius: var(--highlight-border-radius);
        box-shadow: var(--highlight-box-shadow);
        display: inline-block;
        padding: 8px;
        transform: rotateZ(-1deg);
      }

      h2 span {
        display: inline-block;
        transform: rotateZ(1deg);
      }

      @media (max-width: ${SizeMax.Xs}px) {
        h2 {
          margin-top: 7px;
          font-size: 0.9em;
        }
      }

      .alert {
        font-family: var(--subtitle-font);
      }
    `;

    return [
      BootstrapBase.styles,
      localStyles
    ];
  }

  @state() locationPath: string = "/";
  @state() isOnline: boolean = navigator.onLine;
  @state() hideOfflineAlert = false;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("vaadin-router-location-changed", e => this.routeChanged(e as CustomEvent));
    window.addEventListener('online', () => this.isOnline = navigator.onLine);
    this.listenForOfflineStatusChange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("vaadin-router-location-changed", e => this.routeChanged(e as CustomEvent))
  }

  async listenForOfflineStatusChange() {
    const module = await import("../services/online-detector");
    const detector = new module.OnlineDetector();
    detector.checkOnline().then(result => this.isOnline = result);
  }

  routeChanged(e: CustomEvent) {
    this.locationPath = e.detail?.location?.pathname || "";
  }

  get isOnHomePage(): boolean {
    return this.locationPath === "/" || this.locationPath === "";
  }

  render() {
    return html`
      <header class="d-flex justify-content-center flex-wrap d-print-none">
        <a href="/">
          <img src="/assets/images/128x128.png" alt="Messianic Chords logo" />
        </a>
        <div>
          <h1 class="mb-0">
            <a href="/">Messianic Chords</a>
          </h1>
          <!-- This is hidden on xs screen -->
          ${this.renderLargeSubheader()}
        </div>
        <!-- On XS screen, show the subtitle beneath the  -->
        ${this.renderPhoneSubheader()}
      </header>

      <div class="d-flex justify-content-center d-print-none">
        ${this.renderOfflineStatus()}
      </div>
    `;
  }

  renderLargeSubheader(): TemplateResult {
    return html`
      <h2 class="d-none d-sm-inline-block">
        <span>Chord charts and lyrics for Messiah's music</span>
      </h2>
    `;
  }

  renderPhoneSubheader(): TemplateResult {
    if (!this.isOnHomePage) {
      return html``;
    }

    return html`
      <h2 class="d-block d-sm-none w-100 text-center">
        <span>Chord charts for Messiah's music</span>
      </h2>
    `;
  }

  renderOfflineStatus(): TemplateResult {
    if (this.isOnline || this.hideOfflineAlert) {
      return html``;
    }

    return html`
      <div class="alert alert-warning alert-dismissible fade show d-inline-block" role="alert">
        <strong>You're offline.</strong> You can view chord charts you previously viewed while online.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" @click="${() => this.hideOfflineAlert = true}"></button>
      </div>
    `;
  }
}
