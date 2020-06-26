namespace BitShuva.Chavah {
    export class PopularController {

        static $inject = [
            "songApi",
            "appNav",
        ];

        songsList = new PagedList((skip, take) => this.songApi.getPopular(skip, take));

        constructor(
            private readonly songApi: SongApiService,
            private readonly appNav: AppNavService) {
        }

        $onInit() {
            this.songsList.take = 25;
            this.songsList.fetchNextChunk();
            this.appNav.goBackUrl = "#/nowplaying";
        }
    }

    App.controller("PopularController", PopularController);
}
