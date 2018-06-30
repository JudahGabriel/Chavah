namespace BitShuva.Chavah {
    export class MyLikesController {
        private readonly songs = new PagedList<Song>((skip, take) => this.songApi.getLikes(skip, take));

        constructor(
            private readonly songApi: SongApiService) {

        }

        $onInit() {
            this.songs.fetchNextChunk();
        }
    }

    App.controller("MyLikesController", MyLikesController);
}