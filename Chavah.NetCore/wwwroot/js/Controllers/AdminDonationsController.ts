namespace BitShuva.Chavah {
    export class AdminDonationsController {

        static $inject = [
            "artistApi"
        ];

        showDonationsForArtistsWithoutContactInfo = true;
        minimum = 10;
        dueDonations = new List<Server.DueDonation>(() => this.artistApi.getDueDonations(this.minimum));
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
        }

        friendlyDate(dateIso: string) {
            return moment(dateIso)
                .local()
                .format("MMM D YYYY");
        }

        markAsPaid(donation: Server.DueDonation) {
            this.artistApi.markDueDonationAsPaid(donation)
                .then(() => this.dueDonations.remove(donation));
        }

        disburseDonations() {
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

        get canDisburse(): boolean {
            return this.donationAmount > 0 && this.donationDisbursementMonth <= new Date() && !this.isDisbursing;
        }
    }

    App.controller("AdminDonationsController", AdminDonationsController);
}
