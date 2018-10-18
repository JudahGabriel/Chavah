namespace BitShuva.Chavah {
    export class TrendingController {

        static readonly maxVisibleSongs = 5;

        static $inject = [
            "songApi",
            "audioPlayer",
        ];

        songsList = new PagedList((skip, take) => this.songApi.getTrendingSongs(skip, take));
        visibleSongs: Song[] = [];
        visibleStart = 0;

        constructor(
            private readonly songApi: SongApiService,
            private readonly audioPlayer: AudioPlayerService) {

            this.songsList.fetchNextChunk();
        }

        get canGoPrevious(): boolean {
            return this.visibleStart > 0;
        }

        get canGoNext(): boolean {
            return this.songsList.itemsTotalCount !== null && this.visibleStart < (this.songsList.itemsTotalCount - 1);
        }

        next() {
            if (this.canGoNext) {
                this.visibleStart++;
            }
        }

        previous() {
            if (this.canGoPrevious) {
                this.visibleStart--;
            }
        }

        playSong(song: Song) {
            this.audioPlayer.playSongById(song.id);
        }
    }

    App.controller("TrendingController", TrendingController);
}
