import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { userApi } from "../services/user-api-service";
import { accountService } from "../services/account-service";
import type { User } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

interface TimeframeOption {
  title: string;
  days: number;
}

@customElement("admin-users-page")
export class AdminUsersPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private oldEmail = "";
  @state() private newEmail = "";
  @state() private isMigratingUser = false;
  @state() private showUserMigrationSuccess = false;
  @state() private userMigrationErrorMessage = "";
  @state() private registrations: User[] = [];
  @state() private registrationsTotal = 0;
  @state() private isLoadingRegistrations = false;
  @state() private registrationsError = "";
  @state() private activeTimeframe: TimeframeOption;

  private readonly timeframes: TimeframeOption[] = [
    { title: "Last week", days: 7 },
    { title: "Last month", days: 30 },
    { title: "Last 3 months", days: 30 * 3 },
    { title: "Last 6 months", days: 30 * 6 },
    { title: "Last year", days: 365 },
    { title: "Last 5 years", days: 365 * 5 },
  ];

  private readonly dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

  constructor() {
    super();
    this.activeTimeframe = this.timeframes[0];
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this.changeTimeframe(this.activeTimeframe);
  }

  private async changeTimeframe(timeframe: TimeframeOption): Promise<void> {
    this.activeTimeframe = timeframe;
    this.isLoadingRegistrations = true;
    this.registrationsError = "";
    try {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - timeframe.days);
      const users = await userApi.getRegistrations(since.toISOString());
      this.registrations = users.items;
      this.registrationsTotal = users.total;
    } catch (error) {
      this.registrationsError = this.formatError(error);
    } finally {
      this.isLoadingRegistrations = false;
    }
  }

  private async migrateUserEmail(): Promise<void> {
    if (!this.canMigrateUser) {
      return;
    }

    this.isMigratingUser = true;
    this.showUserMigrationSuccess = false;
    this.userMigrationErrorMessage = "";
    try {
      await accountService.migrateUserEmail(this.oldEmail, this.newEmail);
      this.oldEmail = "";
      this.newEmail = "";
      this.showUserMigrationSuccess = true;
    } catch (error) {
      this.userMigrationErrorMessage = this.formatError(error);
    } finally {
      this.isMigratingUser = false;
    }
  }

  private get canMigrateUser(): boolean {
    return !this.isMigratingUser && !!this.oldEmail && !!this.newEmail && this.oldEmail !== this.newEmail;
  }

  private get chartRows(): Array<{ user: User; count: number; width: number }> {
    const max = Math.max(this.registrationsTotal, 1);
    return this.registrations.map((user, index) => {
      const count = this.registrationsTotal - this.registrations.length + index + 1;
      return { user, count, width: Math.max((count / max) * 100, 1) };
    });
  }

  private formatDate(dateIso: string): string {
    return this.dateFormatter.format(new Date(dateIso));
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private renderRegistrations() {
    if (this.isLoadingRegistrations) {
      return html`<h4><wa-spinner></wa-spinner> Loading registrations...</h4>`;
    }

    if (this.registrationsError) {
      return html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.registrationsError}</wa-callout>`;
    }

    if (!this.registrations.length) {
      return html`<wa-callout variant="neutral"><wa-icon slot="icon" name="circle-info"></wa-icon>No registrations found.</wa-callout>`;
    }

    return html`
      <div class="admin-users-chart">
        <h3>${this.registrations.length} new users</h3>
        <p class="text-muted">in the ${this.activeTimeframe.title.toLowerCase()}</p>
        ${this.chartRows.map(
          ({ user, count, width }) => html`
            <div class="registration-row">
              <span>${this.formatDate(user.registrationDate)}</span>
              <div class="registration-bar-track"><div class="registration-bar" style=${`width: ${width}%`}></div></div>
              <strong>${count}</strong>
            </div>
          `,
        )}
      </div>
    `;
  }

  render() {
    return html`
      <section class="admin-page">
        <div class="admin-layout">
          <admin-sidebar active="users"></admin-sidebar>
          <div>
            <div class="btn-group" role="group" aria-label="New user registrations timeframe">
              ${this.timeframes.map(
                (timeframe) => html`
                  <wa-button
                    variant=${timeframe === this.activeTimeframe ? "brand" : "neutral"}
                    @click=${() => this.changeTimeframe(timeframe)}
                  >
                    ${timeframe.title}
                  </wa-button>
                `,
              )}
            </div>
            <br /><br />
            ${this.renderRegistrations()}
            <hr />
            <h3>User account migration</h3>
            <form @submit=${(e: SubmitEvent) => { e.preventDefault(); void this.migrateUserEmail(); }}>
              <wa-input type="email" label="Old email address" autocomplete="off" .value=${this.oldEmail} @input=${(e: Event) => (this.oldEmail = (e.target as HTMLInputElement).value)}></wa-input>
              <br />
              <wa-input type="email" label="New email address" autocomplete="off" .value=${this.newEmail} @input=${(e: Event) => (this.newEmail = (e.target as HTMLInputElement).value)}></wa-input>
              ${this.userMigrationErrorMessage
                ? html`<p class="text-danger">Error migrating user: ${this.userMigrationErrorMessage}</p>`
                : nothing}
              ${this.showUserMigrationSuccess
                ? html`<p class="text-success"><wa-icon name="check"></wa-icon> Successfully migrated user account.</p>`
                : nothing}
              <wa-button type="submit" variant="brand" ?disabled=${!this.canMigrateUser}>
                ${this.isMigratingUser ? html`<wa-spinner></wa-spinner> Saving...` : html`<wa-icon slot="start" name="floppy-disk"></wa-icon> Migrate`}
              </wa-button>
            </form>
          </div>
        </div>
      </section>
    `;
  }
}
