import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { artistApi } from "../services/artist-api-service";
import type { DueDonation, PaypalOrderConfirmation } from "../models/server-interfaces";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

type DonationTab = "pending" | "new";
type PaypalState = "none" | "order-creating" | "order-created" | "order-confirming" | "order-confirmed" | "error";

interface DueDonationViewModel extends DueDonation {
  paypalState: PaypalState;
  hasDonationUrl: boolean;
}

interface PaypalDonationCallbackEvent {
  artistId: string;
  paypalOrderCreated: boolean;
}

@customElement("admin-donations-page")
export class AdminDonationsPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private showDonationsForArtistsWithoutContactInfo = true;
  @state() private dueDonations: DueDonationViewModel[] = [];
  @state() private currentTab: DonationTab = "pending";
  @state() private donationAmount = 0;
  @state() private donationDisbursementMonth = this.currentMonthValue();
  @state() private disburseDonationButtonText: "Disburse" | "Are you sure?" = "Disburse";
  @state() private isDisbursing = false;
  @state() private hasDisbursedSuccessfully = false;
  @state() private isLoading = false;
  @state() private errorMessage = "";

  private readonly minimum = 10;
  private readonly dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
  private paypalChannel: BroadcastChannel | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadDueDonations();
    this.initializePaypalChannel();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.paypalChannel?.close();
  }

  private async loadDueDonations(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      const donations = await artistApi.getDueDonations(this.minimum);
      this.dueDonations = donations.map((d) => this.createDueDonationViewModel(d));
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private initializePaypalChannel(): void {
    const queryParams = this.getPaypalQueryParams();
    const paypalOrderCreated = queryParams.get("paypalordercreated");
    const paypalOrderArtistId = queryParams.get("artistid");
    this.paypalChannel = new BroadcastChannel("paypal_payment_confirmation");

    if (paypalOrderCreated && paypalOrderArtistId) {
      this.paypalChannel.postMessage({
        artistId: paypalOrderArtistId,
        paypalOrderCreated: paypalOrderCreated === "true",
      } satisfies PaypalDonationCallbackEvent);
      window.close();
      return;
    }

    this.paypalChannel.addEventListener("message", (e: MessageEvent<PaypalDonationCallbackEvent>) =>
      this.paypalOrderConfirmedOrCancelled(e),
    );
  }

  private getPaypalQueryParams(): URLSearchParams {
    const hashQueryIndex = location.hash.indexOf("?");
    if (hashQueryIndex >= 0) {
      return new URLSearchParams(location.hash.substring(hashQueryIndex + 1));
    }
    return new URLSearchParams(location.search);
  }

  private friendlyDate(dateIso: string): string {
    return this.dateFormatter.format(new Date(dateIso));
  }

  private async markAsPaid(donation: DueDonationViewModel): Promise<void> {
    await artistApi.markDueDonationAsPaid(donation);
    this.dueDonations = this.dueDonations.filter((d) => d !== donation);
  }

  private async disburseDonations(): Promise<void> {
    if (!this.canDisburse) {
      return;
    }

    if (this.disburseDonationButtonText === "Disburse") {
      this.disburseDonationButtonText = "Are you sure?";
      return;
    }

    const [year, month] = this.donationDisbursementMonth.split("-").map((p) => Number(p));
    this.isDisbursing = true;
    this.errorMessage = "";
    try {
      await artistApi.recordMessiahsMusicFundMonthlyDisbursement(year, month, this.donationAmount);
      this.hasDisbursedSuccessfully = true;
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isDisbursing = false;
      this.disburseDonationButtonText = "Disburse";
    }
  }

  private hasPaypalEmail(due: DueDonationViewModel): boolean {
    if (!due.donationUrl?.startsWith("paypal:")) {
      return false;
    }
    const url = new URL(due.donationUrl);
    return !!url.searchParams.get("email") || !!url.searchParams.get("username");
  }

  private payViaPaypal(donation: DueDonationViewModel): void {
    if (donation.paypalState === "none") {
      void this.createDonationOrder(donation);
    } else if (donation.paypalState === "order-created") {
      this.popupPaypalConfirmation(donation);
    }
  }

  private getPaypalDisabled(due: DueDonationViewModel): boolean {
    return due.paypalState === "order-confirming" || due.paypalState === "order-creating" || due.paypalState === "error";
  }

  private getPaypalBtnLabel(due: DueDonationViewModel): string {
    switch (due.paypalState) {
      case "order-creating":
        return "Generating invoice...";
      case "order-created":
        return "Confirm payment";
      case "order-confirming":
        return "Confirming...";
      case "order-confirmed":
        return "✅ Payment sent. Marking as paid...";
      case "error":
        return "❌ An error occurred";
      case "none":
        return "Pay via PayPal";
    }
  }

  private createDueDonationViewModel(due: DueDonation): DueDonationViewModel {
    return {
      ...due,
      paypalState: "none",
      hasDonationUrl: !!due.donationUrl && !due.donationUrl.includes("no-response"),
    };
  }

  private async createDonationOrder(donation: DueDonationViewModel): Promise<void> {
    donation.paypalState = "order-creating";
    this.dueDonations = [...this.dueDonations];
    try {
      this.donationOrderCreated(donation, await artistApi.createPaypalOrder(donation));
    } catch (error) {
      this.donationOrderFailed(donation, error);
    }
  }

  private donationOrderCreated(donation: DueDonationViewModel, order: PaypalOrderConfirmation): void {
    donation.order = order;
    donation.paypalState = "order-created";
    this.dueDonations = [...this.dueDonations];
  }

  private donationOrderFailed(donation: DueDonationViewModel, error: unknown): void {
    console.error("Unable to create order for PayPal donation due to an error", error);
    donation.paypalState = "error";
    this.dueDonations = [...this.dueDonations];
  }

  private donationConfirmationFailed(donation: DueDonationViewModel, error: unknown): void {
    console.error("Unable to confirm PayPal donation order due to an error.", error);
    donation.paypalState = "error";
    this.dueDonations = [...this.dueDonations];
  }

  private popupPaypalConfirmation(donation: DueDonationViewModel): void {
    if (!donation.order) {
      donation.paypalState = "error";
      this.dueDonations = [...this.dueDonations];
      console.error("Expected to find an order on the donation, but none was found.");
      return;
    }
    donation.paypalState = "order-confirming";
    this.dueDonations = [...this.dueDonations];
    window.open(donation.order.approveUrl, "popupWindow", "width=600,height=800");
  }

  private paypalOrderConfirmedOrCancelled(e: MessageEvent<PaypalDonationCallbackEvent>): void {
    const donation = this.dueDonations.find((d) => d.artistId.toLowerCase() === e.data.artistId.toLowerCase());
    if (!donation) {
      return;
    }

    if (e.data.paypalOrderCreated) {
      donation.paypalState = "order-confirmed";
      this.dueDonations = [...this.dueDonations];
      artistApi
        .payPaypalOrder(donation)
        .then(() => (this.dueDonations = this.dueDonations.filter((d) => d !== donation)))
        .catch((error: unknown) => this.donationConfirmationFailed(donation, error));
    } else {
      donation.paypalState = "error";
      this.dueDonations = [...this.dueDonations];
      console.warn("PayPal payment was cancelled by the user.");
    }
  }

  private get canDisburse(): boolean {
    const selectedMonth = new Date(`${this.donationDisbursementMonth}-01T00:00:00`);
    return this.donationAmount > 0 && selectedMonth <= new Date() && !this.isDisbursing;
  }

  private currentMonthValue(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private renderPendingTab() {
    return html`
      <h4>Disbursements yet to be distributed to artists, $${this.minimum} minimum</h4>
      <wa-checkbox
        ?checked=${this.showDonationsForArtistsWithoutContactInfo}
        @change=${(e: Event) => (this.showDonationsForArtistsWithoutContactInfo = (e.target as HTMLInputElement).checked)}
      >
        Show donations for artists without contact info
      </wa-checkbox>
      ${this.isLoading ? html`<h4><wa-spinner></wa-spinner> Loading donations...</h4>` : nothing}
      ${this.dueDonations.map((due) => this.renderDueDonation(due))}
      ${!this.isLoading && !this.dueDonations.length
        ? html`<wa-callout variant="neutral"><wa-icon slot="icon" name="circle-info"></wa-icon>No pending disbursements.</wa-callout>`
        : nothing}
    `;
  }

  private renderDueDonation(due: DueDonationViewModel) {
    const showBody = this.showDonationsForArtistsWithoutContactInfo || due.hasDonationUrl;
    return html`
      <div class="panel panel-primary">
        <div class="panel-heading clearfix">
          <div class="d-flex justify-space-between">
            <h3 class="panel-title">${due.name} - $${due.amount.toFixed(2)}</h3>
            <div class="d-flex gap-1">
              ${this.hasPaypalEmail(due)
                ? html`<wa-button size="small" variant="brand" @click=${() => this.payViaPaypal(due)} ?disabled=${this.getPaypalDisabled(due)}>${this.getPaypalBtnLabel(due)}</wa-button>`
                : nothing}
              <wa-button size="small" @click=${() => this.markAsPaid(due)}>Mark as paid</wa-button>
            </div>
          </div>
        </div>
        ${showBody
          ? html`<div class="panel-body">
              ${due.donationUrl ? html`<a href=${due.donationUrl}>${due.donationUrl}</a>` : nothing}
              <ul>
                ${due.donations.map(
                  (donation) => html`
                    <li>
                      $${donation.amount.toFixed(2)} to ${donation.recipientArtist} on ${this.friendlyDate(donation.date)}
                      by ${donation.donorName}, ${donation.donorEmail}
                    </li>
                  `,
                )}
              </ul>
            </div>`
          : nothing}
      </div>
    `;
  }

  private renderNewTab() {
    return html`
      <h4>Distribute a month's donations from Messiah's Music Fund</h4>
      <p>The amount donated to each artist will be based total songs played in the month</p>
      <form class="form" @submit=${(e: SubmitEvent) => { e.preventDefault(); void this.disburseDonations(); }}>
        <wa-input type="month" label="Month" .value=${this.donationDisbursementMonth} @input=${(e: Event) => (this.donationDisbursementMonth = (e.target as HTMLInputElement).value)}></wa-input>
        <br />
        <wa-input type="number" min="0" step="1" label="Donations" placeholder="500" .value=${String(this.donationAmount)} @input=${(e: Event) => (this.donationAmount = Number((e.target as HTMLInputElement).value))}>
          <span slot="prefix">$</span>
        </wa-input>
        <br />
        ${this.hasDisbursedSuccessfully
          ? html`<p class="text-success"><wa-icon name="circle-check"></wa-icon> Disbursement distributed successfully</p>`
          : html`<wa-button type="submit" ?disabled=${!this.canDisburse}>${this.isDisbursing ? html`<wa-spinner></wa-spinner> Disbursing...` : this.disburseDonationButtonText}</wa-button>`}
      </form>
    `;
  }

  render() {
    return html`
      <section class="admin-page">
        <div class="admin-layout">
          <admin-sidebar active="donations"></admin-sidebar>
          <div>
            <div class="btn-group" role="group" aria-label="Donation admin tabs">
              <wa-button variant=${this.currentTab === "pending" ? "brand" : "neutral"} @click=${() => (this.currentTab = "pending")}>Pending disbursements</wa-button>
              <wa-button variant=${this.currentTab === "new" ? "brand" : "neutral"} @click=${() => (this.currentTab = "new")}>New disbursement</wa-button>
            </div>
            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            ${this.currentTab === "pending" ? this.renderPendingTab() : this.renderNewTab()}
          </div>
        </div>
      </section>
    `;
  }
}
