namespace BitShuva.Chavah {
    export class ShareThanksController {
        readonly artist: string | null;

        static $inject = [
            "$routeParams"
        ];

        constructor($routeParams: ng.route.IRouteParamsService) {
            this.artist = $routeParams["artist"];
        }

        get donateUrl(): string {
            if (this.artist) {
                return `#/donate/${encodeURIComponent(this.artist)}`;
            }

            return "#/donate";
        }

        get donateText(): string {
            if (this.artist) {
                return `Donate to ${this.artist}`
            }

            return "Donate to the artists";
        }
    }

    App.controller("ShareThanksController", ShareThanksController);
}