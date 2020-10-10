namespace BitShuva.Chavah {
    export class AdminDonationsController {

        static $inject = [
            "artistApi"
        ];

        minimum = 5;
        dueDonations = new List<Server.DueDonation>(() => this.artistApi.getDueDonations(this.minimum));

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
    }

    App.controller("AdminDonationsController", AdminDonationsController);
}
