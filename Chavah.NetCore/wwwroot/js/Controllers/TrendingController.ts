namespace BitShuva.Chavah {
    export class TrendingController {
        
        static $inject = [
            "songApi",
            "audioPlayer",
        ];

        songsList = new PagedList((skip, take) => this.songApi.getTrendingSongs(skip, take));
        
        constructor(
            private readonly songApi: SongApiService,
            private readonly audioPlayer: AudioPlayerService) {
        }

        $onInit() {
            this.songsList.take = 25;
            this.songsList.fetchNextChunk();
        }

        playSong(song: Song) {
            this.audioPlayer.playSongById(song.id);
        }
    }

    App.controller("TrendingController", TrendingController);
}
