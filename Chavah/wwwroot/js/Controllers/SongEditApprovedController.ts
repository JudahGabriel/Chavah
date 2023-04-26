namespace BitShuva.Chavah {
    export class SongEditApprovedController {

        static $inject = [
            "$routeParams",
        ];

        artist: string;
        songName: string;

        constructor($routeParams: ng.route.IRouteParamsService) {
            this.artist = $routeParams["artist"];
            this.songName = $routeParams["songName"];
        }
    }

    App.controller("SongEditApprovedController", SongEditApprovedController);
}
