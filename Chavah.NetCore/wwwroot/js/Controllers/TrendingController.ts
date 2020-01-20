namespace BitShuva.Chavah {
    export class TrendingController {
        
        static $inject = [
            "songApi"
        ];

        songsList = new PagedList((skip, take) => this.songApi.getTrendingSongs(skip, take));
        
        constructor(private readonly songApi: SongApiService) {
        }

        $onInit() {
            this.songsList.take = 25;
            this.songsList.fetchNextChunk();
        }
    }

    App.controller("TrendingController", TrendingController);
}
