namespace BitShuva.Chavah {
    export class DonateController {

        static $inject = [
            "artistApi",
            "$routeParams",
        ];

        desiredArtistName: string | null = null;
        donationTargetOptions = [
            "Chavah Messianic Radio",
            "All artists on Chavah Messianic Radio",
        ];
        donationTarget = this.donationTargetOptions[0];
        selectedArtist: Server.IArtist | null = null;

        constructor(
            artistApi: ArtistApiService,
            $routeParams: ng.route.IRouteParamsService) {

            this.desiredArtistName = $routeParams["artist"];
            if (this.desiredArtistName) {
                this.donationTargetOptions.push(this.desiredArtistName);
                this.donationTarget = this.desiredArtistName;
            }

            artistApi.getAll("", 0, 1000)
                .then(results => this.allArtistsFetched(results.items));
        }

        allArtistsFetched(artists: Server.IArtist[]) {
            let artistNames = artists.map(a => a.name);
            this.donationTargetOptions.push(...artistNames);
        }
    }

    App.controller("DonateController", DonateController);
}
