namespace BitShuva.Chavah {
    export class SubmitSongEditController {
        song: Song | null;

        static $inject = [
            "$routeParams"
        ];

        constructor($routeParams: ng.route.IRouteParamsService) {
            //var songIdNumber = $routeParams.
        }
    }

    App.controller("SubmitSongEditController", SubmitSongEditController);
}