namespace BitShuva.Chavah {
    export class PopularController {

        static $inject = [
            "songApi",
            "audioPlayer",
        ];

        songsList = new PagedList((skip, take) => this.songApi.getPopular(skip, take));

        constructor(
            private readonly songApi: SongApiService) {
        }

        $onInit() {
            this.songsList.take = 25;
            this.songsList.fetchNextChunk();
        }
    }

    App.controller("PopularController", PopularController);
}
