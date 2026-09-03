import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { accountService } from "../services/account-service";
import { appNav } from "../services/app-nav-service";
import type { User } from "../models/user";
import type { Notification } from "../models/server-interfaces";
import { getHomeViewModel } from "../shared/home-view-model";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";

const DONATION_BANNER_KEY = "hasDismissedDonationBanner";

/**
 * The top app bar: brand title, subtitle/go-back, notifications dropdown,
 * profile/nav dropdown, and the donation callout. Ported from
 * `views/partials/Header.html` + `HeaderController.ts` + `header.less`.
 */
@customElement("chavah-header")
export class ChavahHeader extends LitElement {
  // Light DOM so the ported header styles and global.css apply normally.
  createRenderRoot() {
    return this;
  }

  @state() private user: User | null = accountService.currentUser;
  @state() private showGoBack = window.location.pathname !== "/";
  @state() private showDonationBanner = false;

  private readonly homeViewModel = getHomeViewModel();
  private unsubscribe: () => void = () => {};
  private navHandler = () => {
    this.showGoBack = window.location.pathname !== "/";
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = accountService.signedInState.subscribe(() => {
      this.user = accountService.currentUser;
    });
    window.addEventListener("popstate", this.navHandler);
    window.addEventListener("chavah:navigated", this.navHandler);

    if (!this.hasDismissedDonationBanner() && !this.homeViewModel.embed) {
      window.setTimeout(() => (this.showDonationBanner = true), 5 * 60 * 1000);
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe();
    window.removeEventListener("popstate", this.navHandler);
    window.removeEventListener("chavah:navigated", this.navHandler);
    super.disconnectedCallback();
  }

  private get currentUserName(): string {
    return this.user ? this.user.email : "";
  }

  private get isAdmin(): boolean {
    return !!this.user && this.user.isAdmin;
  }

  private get profilePicUrl(): string | null {
    return this.user ? this.user.profilePicUrl : null;
  }

  private get notifications(): Notification[] {
    return this.user?.notifications ?? [];
  }

  private get unreadNotificationCount(): number {
    return this.notifications.filter((n) => n.isUnread).length;
  }

  private get isOnIOS(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("iphone") || ua.includes("ipad");
  }

  private get externalTarget(): "_self" | "_blank" {
    return this.isOnIOS ? "_self" : "_blank";
  }

  private signOut(): void {
    accountService.signOut().then(() => appNav.signOut());
  }

  private markNotificationsAsRead(): void {
    if (this.notifications.some((n) => n.isUnread)) {
      this.notifications.forEach((n) => (n.isUnread = false));
      accountService.clearNotifications();
      this.requestUpdate();
    }
  }

  private hasDismissedDonationBanner(): boolean {
    return window.localStorage.getItem(DONATION_BANNER_KEY) === "true";
  }

  private dismissDonationBanner(): void {
    window.localStorage.setItem(DONATION_BANNER_KEY, "true");
    this.showDonationBanner = false;
  }

  render() {
    return html`
      ${this.styles()}
      <header class="chavah-header">
        <div class="header-inner">
          <div class="header-left">
            <img class="left-decor" src="/images/LeftDecor.jpg" alt="" />
            <div class="header-titles">
            <div class="title">
              <a href="/">
                Chavah <span class="hidden-xs">Messianic Radio</span>
                <span class="hebrew" lang="he">חוה</span>
              </a>
            </div>
            ${this.showGoBack
              ? html`<div class="go-back">
                  <wa-button appearance="plain" @click=${() => history.back()}>
                    <wa-icon slot="start" name="circle-arrow-left"></wa-icon> Go back
                  </wa-button>
                </div>`
              : html`<div class="subtitle">${this.homeViewModel.pageDescription}</div>`}
            </div>
          </div>

          <div class="header-right">
            ${this.notifications.length > 0 ? this.renderNotifications() : ""}
            ${this.renderProfileMenu()}
          </div>
        </div>

        ${this.showDonationBanner ? this.renderDonationBanner() : ""}
      </header>
    `;
  }

  private renderNotifications() {
    return html`
      <wa-dropdown class="notifications-btn" placement="bottom-end">
        <wa-button slot="trigger" class="notif-trigger" appearance="plain" @click=${() => this.markNotificationsAsRead()}>
          <wa-icon name="bell"></wa-icon>
          ${this.unreadNotificationCount > 0
            ? html`<wa-badge variant="danger" pill class="notif-badge">${this.unreadNotificationCount}</wa-badge>`
            : ""}
        </wa-button>
        <div class="notifications-menu">
          ${this.notifications.map(
            (n) => html`
              <a
                class="notification ${n.isUnread ? "unread" : ""}"
                href=${n.url}
                target=${this.externalTarget}
                rel="noopener"
              >
                ${n.imageUrl ? html`<img class="source-img" src=${n.imageUrl} />` : ""}
                <span class="description">
                  <strong>${n.title}</strong><br />
                  <span class="text-muted">via</span> ${n.sourceName}
                </span>
              </a>
            `,
          )}
        </div>
      </wa-dropdown>
    `;
  }

  private renderProfileMenu() {
    const signedIn = !!this.currentUserName;
    return html`
      <wa-dropdown class="profile-btn" placement="bottom-end">
        <wa-button slot="trigger" appearance="plain" caret>
          ${signedIn
            ? this.profilePicUrl
              ? html`<img class="profile-pic" src=${this.profilePicUrl} />`
              : html`<wa-icon name="circle-user"></wa-icon>`
            : html`<wa-icon name="bars"></wa-icon>`}
        </wa-button>

        ${signedIn
          ? html`<wa-dropdown-item href="/profile"
                ><wa-icon slot="start" name="circle-user"></wa-icon>My profile</wa-dropdown-item
              >
              <wa-divider></wa-divider>`
          : ""}
        <wa-dropdown-item href="/nowplaying"><wa-icon slot="start" name="house"></wa-icon>Home</wa-dropdown-item>
        ${signedIn
          ? html`<wa-dropdown-item href="/mylikes"
              ><wa-icon slot="start" name="thumbs-up"></wa-icon>My likes</wa-dropdown-item
            >`
          : ""}
        <wa-dropdown-item href="/trending"
          ><wa-icon slot="start" name="arrow-trend-up"></wa-icon>Trending</wa-dropdown-item
        >
        <wa-dropdown-item href="/recent"
          ><wa-icon slot="start" name="backward-step"></wa-icon>Recent</wa-dropdown-item
        >
        <wa-dropdown-item href="/popular"
          ><wa-icon slot="start" name="star"></wa-icon>Popular</wa-dropdown-item
        >
        <wa-divider></wa-divider>
        <wa-dropdown-item
          href="https://discord.com/channels/1106734875031109733/1106734876218101762"
          target="_blank"
          rel="noopener"
          ><wa-icon slot="start" name="discord" family="brands"></wa-icon>Chat with us on Discord</wa-dropdown-item
        >
        <wa-dropdown-item href="/support"
          ><wa-icon slot="start" name="envelope"></wa-icon>Contact us</wa-dropdown-item
        >
        <wa-dropdown-item href="https://www.patreon.com/chavah" target=${this.externalTarget} rel="noopener"
          ><wa-icon slot="start" name="money-bill"></wa-icon>Donate</wa-dropdown-item
        >
        <wa-dropdown-item href="/about"
          ><wa-icon slot="start" name="circle-info"></wa-icon>About</wa-dropdown-item
        >
        <wa-divider></wa-divider>
        ${!signedIn
          ? html`<wa-dropdown-item href="/signin"
                ><wa-icon slot="start" name="right-to-bracket"></wa-icon>Sign In</wa-dropdown-item
              >
              <wa-dropdown-item href="/register"
                ><wa-icon slot="start" name="user-plus"></wa-icon>Register</wa-dropdown-item
              >`
          : ""}
        ${this.isAdmin
          ? html`<wa-dropdown-item href="/admin"
              ><wa-icon slot="start" name="user-gear"></wa-icon>Administration</wa-dropdown-item
            >`
          : ""}
        ${signedIn
          ? html`<wa-dropdown-item @click=${() => this.signOut()}
              ><wa-icon slot="start" name="right-from-bracket"></wa-icon>Sign out</wa-dropdown-item
            >`
          : ""}
      </wa-dropdown>
    `;
  }

  private renderDonationBanner() {
    return html`
      <wa-callout class="donation-alert" variant="brand">
        <wa-icon slot="icon" name="heart"></wa-icon>
        <strong>Would you help us?</strong> Chavah is raising money for Messiah's musicians. 💗
        <a
          href="https://blog.messianicradio.com/2020/06/announcing-messiahs-musicians-fund-we.html"
          target=${this.externalTarget}
          rel="noopener"
          >Learn more</a
        >
        <wa-button
          class="dismiss-btn"
          size="small"
          appearance="plain"
          @click=${() => this.dismissDonationBanner()}
        >
          <wa-icon name="xmark" label="Dismiss"></wa-icon>
        </wa-button>
      </wa-callout>
    `;
  }

  private styles() {
    return html`<style>
      chavah-header .chavah-header {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        background-color: var(--chavah-brand);
        box-shadow: 0 1px 3px 1px gray;
        white-space: nowrap;
        z-index: 10;
        min-height: 100px;
      }
      chavah-header .header-inner {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 8px 20px;
        gap: 12px;
      }
      chavah-header .header-left {
        min-width: 0;
        display: flex;
        align-items: flex-start;
      }
      chavah-header .left-decor {
        margin-left: 10px;
        margin-right: 30px;
        max-height: 97px;
        box-shadow: -2px 0 8px 1px rgba(29, 38, 55, 0.9), 2px 0 8px 1px rgba(29, 38, 55, 0.9);
      }
      chavah-header .header-titles {
        min-width: 0;
      }
      @media (max-width: 767px) {
        chavah-header .left-decor {
          position: absolute;
          z-index: -1;
          left: -85px;
        }
      }
      chavah-header .title {
        color: var(--chavah-title);
        font-size: 42px;
        line-height: 1.1;
        text-shadow: 0 2px 1px #1d2637, 2px 0 1px #1d2637, -2px 0 1px #1d2637, 0 -2px 1px #1d2637;
        font-family: "EB Garamond", serif;
      }
      chavah-header .title a,
      chavah-header .title a:hover,
      chavah-header .title a:active,
      chavah-header .title a:visited {
        color: var(--chavah-title);
        text-decoration: none;
      }
      chavah-header .title .hebrew {
        font-family: var(--chavah-hebrew-font);
        font-size: 48px;
      }
      chavah-header .subtitle {
        color: var(--chavah-title-darker);
        padding: 5px;
        margin-left: 20px;
        margin-top: -6px;
        font-family: "Cardo", serif;
        font-size: 22px;
        white-space: normal;
      }
      chavah-header .go-back {
        margin-top: -6px;
      }
      chavah-header .go-back wa-button::part(base) {
        color: var(--chavah-title);
        font-size: 20px;
      }
      chavah-header .header-right {
        display: flex;
        align-items: center;
        gap: 4px;
        padding-top: 6px;
      }
      chavah-header .header-right wa-button::part(base) {
        color: var(--chavah-title);
        font-size: 22px;
      }
      chavah-header .header-right wa-button::part(base):hover,
      chavah-header .go-back wa-button::part(base):hover {
        background-color: transparent;
        color: var(--chavah-title-darker);
      }
      chavah-header .profile-pic {
        max-width: 30px;
        max-height: 30px;
        border-radius: 50%;
        display: inline;
        vertical-align: middle;
      }
      chavah-header .notifications-menu {
        min-width: 320px;
        max-width: 360px;
        max-height: 500px;
        overflow: auto;
      }
      chavah-header .notif-trigger::part(base) {
        position: relative;
        overflow: visible;
      }
      chavah-header .notif-badge {
        position: absolute;
        top: 0;
        right: -2px;
        --wa-color-danger-fill-loud: #ff0000;
        font-size: 11px;
        line-height: 1;
        font-weight: 700;
        box-shadow: 0 0 0 2px var(--chavah-header-bg, #2f3d58);
      }
      chavah-header .notification {
        display: block;
        padding: 8px 12px;
        border-bottom: 1px solid #ecf0f1;
        color: inherit;
        text-decoration: none;
        white-space: normal;
      }
      chavah-header .notification.unread {
        background-color: #eef1f4;
      }
      chavah-header .notification .source-img {
        max-width: 50px;
        max-height: 50px;
        float: left;
        margin-right: 10px;
      }
      chavah-header .donation-alert {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 12px;
        width: fit-content;
        max-width: calc(100vw - 40px);
        text-align: center;
        white-space: normal;
        z-index: 5;
        color: #fff;
        background-color: rgba(47, 61, 88, 0.95);
        border-color: rgba(47, 61, 88, 0.95);
        padding-right: 2.75rem;
      }
      chavah-header .donation-alert::part(icon) {
        color: var(--chavah-title);
      }
      chavah-header .donation-alert strong {
        color: #fff;
      }
      chavah-header .donation-alert a {
        color: var(--chavah-title);
        text-decoration: underline;
      }
      chavah-header .donation-alert .dismiss-btn {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        margin: 0;
      }
      chavah-header .donation-alert .dismiss-btn::part(base) {
        color: #fff;
      }
      chavah-header .donation-alert .dismiss-btn::part(base):hover {
        background-color: transparent;
        color: var(--chavah-title);
      }
      @media (max-width: 767px) {
        chavah-header .title {
          font-size: 32px;
        }
        chavah-header .hidden-xs {
          display: none;
        }
      }
    </style>`;
  }
}
