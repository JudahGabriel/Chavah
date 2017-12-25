namespace BitShuva.Chavah {
    export class SongEditApprovedController {

        artist: string;
        songName: string;

        static $inject = [
            "$routeParams"
        ];

        constructor($routeParams: ng.route.IRouteParamsService) {
            this.artist = $routeParams["artist"];
            this.songName = $routeParams["songName"];
        }
    }

    App.controller("SongEditApprovedController", SongEditApprovedController as any);
}