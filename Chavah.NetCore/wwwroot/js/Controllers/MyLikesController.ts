namespace BitShuva.Chavah {
    export class MyLikesController {
        private readonly songs = new List<Song>(() => this.songApi.getRandomLikedSongs());

        constructor(
            private readonly songApi: SongApiService) {

        }
    }

    App.controller("MyLikesController", MyLikesController);
}