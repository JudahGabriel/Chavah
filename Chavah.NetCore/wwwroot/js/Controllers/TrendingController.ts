namespace BitShuva.Chavah {
    export class TrendingController {

        static readonly maxVisibleSongs = 5;

        static $inject = [
            "songApi",
            "audioPlayer",
        ];

        songsList = new PagedList(
            (skip, take) => this.songApi.getTrendingSongs(skip, take),
            undefined,
            items => this.calcVisibleSongs(items));
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
                this.calcVisibleSongs(this.songsList.items);
            }
        }

        previous() {
            if (this.canGoPrevious) {
                this.visibleStart--;
                this.calcVisibleSongs(this.songsList.items);
            }
        }

        playSong(song: Song) {
            this.audioPlayer.playSongById(song.id);
        }

        async calcVisibleSongs(items: Song[]) {
            this.visibleSongs = items.slice(this.visibleStart, this.visibleStart + TrendingController.maxVisibleSongs);
            if (this.visibleSongs.length < TrendingController.maxVisibleSongs) {
                this.songsList.fetchNextChunk();
            }
        }
    }

    App.controller("TrendingController", TrendingController);
}
