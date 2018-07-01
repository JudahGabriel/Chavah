namespace BitShuva.Chavah {
    export class MyLikesController {
        songs = new PagedList<Song>((skip, take) => this.songApi.getLikes(skip, take, this.search));
        searchText = "";

        static $inject = [
            "songApi",
            "audioPlayer",
            "appNav"
        ];

        constructor(
            private readonly songApi: SongApiService,
            private readonly audioPlayer: AudioPlayerService,
            private readonly appNav: AppNavService) {

            this.songs.take = 20;
        }

        get search(): string {
            return this.searchText;
        }

        set search(val: string) {
            this.searchText = val;
            this.songs.resetAndFetch();
        }

        $onInit() {
            this.songs.fetchNextChunk();
        }

        playSong(song: Song) {
            this.audioPlayer.playSongById(song.id);
            this.appNav.nowPlaying();
        }
    }

    App.controller("MyLikesController", MyLikesController);
}