namespace BitShuva.Chavah {
    export class DonateController {

        static $inject = [
            "artistApi",
            "homeViewModel",
            "$routeParams"
        ];

        desiredArtistName: string | null = null;
        donationTargetOptions: string[];
        donationTarget;

        selectedArtist: Server.Artist | null = null;

        constructor(
            artistApi: ArtistApiService,
            private homeViewModel: Server.HomeViewModel,
            $routeParams: ng.route.IRouteParamsService) {

            this.donationTargetOptions = [
                this.homeViewModel.pageTitle,
                `All artists on ${this.homeViewModel.pageTitle}`,
            ];
            this.donationTarget = this.donationTargetOptions[0];

            this.desiredArtistName = $routeParams["artist"];
            if (this.desiredArtistName) {
                this.donationTargetOptions.push(this.desiredArtistName);
                this.donationTarget = this.desiredArtistName;
            }

            artistApi.getAll("", 0, 1000)
                .then(results => this.allArtistsFetched(results.items));
        }

        allArtistsFetched(artists: Server.Artist[]) {
            let artistNames = artists.map(a => a.name);
            this.donationTargetOptions.push(...artistNames);
        }
    }

    App.controller("DonateController", DonateController);
}
