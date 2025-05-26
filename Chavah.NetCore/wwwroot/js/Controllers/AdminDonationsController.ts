namespace BitShuva.Chavah {

    interface DueDonationViewModel extends Server.DueDonation {
        paypalState: "none" | "order-creating" | "order-created" | "order-confirming" | "order-confirmed" | "error";
        hasDonationUrl: boolean;
    }

    interface PaypalDonationCallbackEvent {
        artistId: string;
        paypalOrderCreated: boolean;
    }

    export class AdminDonationsController {

        static $inject = [
            "artistApi"
        ];

        showDonationsForArtistsWithoutContactInfo = true;
        minimum = 10;
        dueDonations = new List<DueDonationViewModel>(() => this.getDueDonations());
        currentTab: "pending" | "new" = "pending";
        donationAmount = 0;
        donationDisbursementMonth = new Date();
        disburseDonationButtonText: "Disburse" | "Are you sure?" = "Disburse";
        isDisbursing = false;
        hasDisbursed = false;

        constructor(private readonly artistApi: ArtistApiService) {
        }

        $onInit() {
            this.dueDonations.fetch();

            // Listen for when Paypal calls back to us after successful or failed payment.
            const crossTabCommunicationChannel = new BroadcastChannel("paypal_payment_confirmation");
            
            // Is this window being called back from Paypal?
            // Do we have query params in our hash? We use .hash rather than .search because hash is used for client-side navigation.
            const queryParamStartIndex = location.hash.indexOf("?");
            const queryParamsStr = queryParamStartIndex >= 0 ? new URLSearchParams(location.hash.substring(queryParamStartIndex)) : "";
            const queryParams = new URLSearchParams(queryParamsStr);
            const paypalOrderCreated = queryParams.get("paypalordercreated");
            const paypalOrderArtistId = queryParams.get("artistid");
            if (paypalOrderCreated && paypalOrderCreated) {
                // OK, we're being loaded as a Paypal callback.
                // Let other tabs know the result, then close this window.
                crossTabCommunicationChannel.postMessage({ artistId: paypalOrderArtistId, paypalOrderCreated: paypalOrderCreated === "true" });
                console.log("Detected we're a Paypal callback popup. Notifying other tabs and closing.");
                window.close();
            } else {
                // We're not a Paypal callback popup. Listen for Paypal callbacks.
                crossTabCommunicationChannel.addEventListener("message", e => this.paypalOrderConfirmedOrCancelled(e));
            }
        }

        friendlyDate(dateIso: string) {
            return moment(dateIso)
                .local()
                .format("MMM D YYYY");
        }

        markAsPaid(donation: DueDonationViewModel) {
            this.artistApi.markDueDonationAsPaid(donation)
                .then(() => this.dueDonations.remove(donation));
        }

        disburseDonations(): void {
            if (this.canDisburse) {
                if (this.disburseDonationButtonText === "Disburse") {
                    this.disburseDonationButtonText = "Are you sure?";
                } else {
                    const oneBasedMonth = this.donationDisbursementMonth.getMonth() + 1;
                    this.isDisbursing = true;
                    this.artistApi.recordMessiahsMusicFundMonthlyDisbursement(this.donationDisbursementMonth.getFullYear(), oneBasedMonth, this.donationAmount)
                        .finally(() => {
                            this.isDisbursing = false;
                            this.disburseDonationButtonText = "Disburse";
                        });
                }
            }
        }

        hasPaypalEmail(due: DueDonationViewModel): boolean {
            const hasPayPalDonationUrl = !!due.donationUrl && due.donationUrl.startsWith("paypal:");
            if (hasPayPalDonationUrl) {
                const url = new URL(due.donationUrl);
                return !!url.searchParams.get("email") || !!url.searchParams.get("username");
            }

            return false;
        }

        payViaPaypal(donation: DueDonationViewModel): void {
            if (donation.paypalState === "none") {
                this.createDonationOrder(donation);
            } else if (donation.paypalState === "order-created") {
                this.popupPaypalConfirmation(donation);               
            }
        }

        getPaypalDisabled(due: DueDonationViewModel): boolean {
            return due.paypalState === "order-confirming" || due.paypalState === "order-creating" || due.paypalState === "error";
        }

        getPaypalBtnLabel(due: DueDonationViewModel): string {
            switch (due.paypalState) {
                case "order-creating": return "Generating invoice...";
                case "order-created": return "Confirm payment";
                case "order-confirming": return "Confirming...";
                case "order-confirmed": return "✅ Payment sent. Marking as paid...";
                case "error": return "❌ An error occured";
                case "none": return "Pay via Paypal"
                default: return "Pay via Paypal"
            }
        }

        getDueDonations(): ng.IPromise<DueDonationViewModel[]> {
            return this.artistApi.getDueDonations(this.minimum)
                .then(donations => donations.map(d => this.createDueDonationViewModel(d)));
        }

        createDueDonationViewModel(due: Server.DueDonation): DueDonationViewModel {
            const vm: DueDonationViewModel = {
                paypalState: "none",
                hasDonationUrl: !!due.donationUrl && !due.donationUrl.includes("no-response"),
                ...due
            };
            return vm;
        }

        createDonationOrder(donation: DueDonationViewModel): void {
            // Create an order for this payment.
            donation.paypalState = "order-creating";
            this.artistApi.createPaypalOrder(donation)
                .then(result => this.donationOrderCreated(donation, result))
                .catch(err => this.donationOrderFailed(donation, err));
        }

        donationOrderCreated(donation: DueDonationViewModel, order: Server.PaypalOrderConfirmation): void {
            donation.order = order;
            donation.paypalState = "order-created";
        }

        donationOrderFailed(donation: DueDonationViewModel, error: any): void {
            console.error("Unable to create order for Paypal donation due to an error", error);
            donation.paypalState = "error";
        }

        donationConfirmationFailed(donation: DueDonationViewModel, error: any): void {
            console.error("Unable to confirm Paypal donation order due to an error.", error);
            donation.paypalState = "error";
        }

        popupPaypalConfirmation(donation: DueDonationViewModel): void {
            // Make sure we have an order.
            if (!donation.order) {
                donation.paypalState = "error";
                console.error("Expected to find an order on the donation, but none was found.");
                return;

            } 
            // This will open a new popup window for PayPal approval.
            // If the user approves, the popup window will redirect to admin donations page with a query string of paypalordercreated = true and artistid=...
            donation.paypalState = "order-confirming";
            window.open(donation.order.approveUrl, "popupWindow", "width=600,height=800");
        }

        paypalOrderConfirmedOrCancelled(e: MessageEvent<PaypalDonationCallbackEvent>): void {
            // Find the corresponding DueDonationViewModel for this artist.
            const donation = this.dueDonations.items.find(d => d.artistId.toLowerCase() === e.data.artistId.toLowerCase());
            if (donation) {
                // Was the payment confirmed or cancelled?
                if (e.data.paypalOrderCreated) {
                    donation.paypalState = "order-confirmed";
                    this.artistApi.payPaypalOrder(donation) // Do the payment
                        .then(() => this.dueDonations.remove(donation)) // Once done, remove it from the UI
                        .catch(err => this.donationConfirmationFailed(donation, err)); // If the payment failed, mark it as failed.
                } else {
                    donation.paypalState = "error";
                    console.warn("Paypal payment was cancelled by the user.");
                }
            }
        }

        get canDisburse(): boolean {
            return this.donationAmount > 0 && this.donationDisbursementMonth <= new Date() && !this.isDisbursing;
        }
    }

    App.controller("AdminDonationsController", AdminDonationsController);
}
