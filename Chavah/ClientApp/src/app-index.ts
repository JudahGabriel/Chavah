import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import './script/components/header';
import './script/components/footer';
import { SizeMax } from './script/common/constants';
import { Router } from '@vaadin/router';

@customElement('app-index')
export class AppIndex extends LitElement {
  static get styles() {
    return css`
      main {
        padding: 16px;
      }

      @media (max-width: ${SizeMax.Md}px) {
        main {
          padding-top: 0;
          margin-top: 30px;
        }
      }

      #routerOutlet {
        position: relative; /* relative so that transitioned in/out pages won't cause scrollbar */
      }

      #routerOutlet > * {
        width: 100% !important;
      }

      #routerOutlet > .entering {
        position: fixed;
        animation: 160ms fadeIn linear;
      }

      #routerOutlet > .leaving {
        position: fixed;
        animation: 160ms fadeOut ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0.2;
        }

        to {
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
        }

        to {
          opacity: 0;
        }
      }
    `;
  }

  constructor() {
    super();
  }

  firstUpdated() {
    // For more info on using the @vaadin/router check here https://vaadin.com/router
    const router = new Router(this.shadowRoot?.querySelector('#routerOutlet'));
    router.setRoutes([
      // temporarily cast to any because of a Type bug with the router
      {
        path: '',
        animate: true,
        children: [
          { path: '/', component: 'app-home', action: async () => await import("./script/pages/app-home") },
        ],
      } as any,
      { path: '/chordsheets/new', component: 'chord-edit', action: async () => await import("./script/pages/chord-edit") } as any,
      { path: '/chordsheets/new/success', component: 'chord-edit-successful', action: async () => await import("./script/pages/chord-edit-successful") as any },
      { path: '/chordsheets/:id/edit/success', component: 'chord-edit-successful', action: async () => await import("./script/pages/chord-edit-successful") } as any,
      { path: '/chordsheets/:id/edit', component: 'chord-edit', action: async () => await import("./script/pages/chord-edit") } as any,
      { path: '/chordsheets/:id', component: 'chord-details', action: async () => await import("./script/pages/chord-details") } as any,
      { path: '/browse/newest', component: 'browse-newest', action: async () => await import("./script/pages/browse-newest") } as any,
      { path: '/browse/songs', component: 'browse-songs', action: async () => await import("./script/pages/browse-songs") } as any,
      { path: '/browse/artists', component: 'browse-artists', action: async () => await import("./script/pages/browse-artists") } as any,
      { path: '/browse/random', component: 'browse-random', action: async () => await import("./script/pages/browse-random") } as any,
      { path: '/artist/:name', component: 'artist-songs', action: async () => await import("./script/pages/artist-songs") } as any,
      { path: '/about', component: 'app-about', action: async () => await import("./script/pages/app-about") } as any
    ]);
  }

  render() {
    return html`
      <div>
        <app-header></app-header>

        <main>
          <div id="routerOutlet"></div>
        </main>

        <app-footer></app-footer>
      </div>
    `;
  }
}
