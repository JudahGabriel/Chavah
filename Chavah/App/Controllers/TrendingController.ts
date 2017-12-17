namespace BitShuva.Chavah {
    export class TrendingController {
        songsList = new PagedList((skip, take) => this.songApi.getTrendingSongs(skip, take), undefined, items => this.calcVisibleSongs(items));
        visibleSongs: Song[] = [];
        visibleStart = 0;

        static readonly maxVisibleSongs = 5;

        static $inject = [
            "songApi",
            "albumCache",
            "audioPlayer"
        ];

        constructor(
            private readonly songApi: SongApiService,
            private readonly albumCache: AlbumCacheService,
            private readonly audioPlayer: AudioPlayerService) {

            this.songsList.fetchNextChunk();
        }

        get canGoPrevious(): boolean {
            return this.visibleStart > 0;
        }

        get canGoNext(): boolean {
            return this.songsList.itemsTotalCount !== null && this.visibleStart < (this.songsList.itemsTotalCount - 1);
        }

        async calcVisibleSongs(items: Song[]) {
            this.visibleSongs = items.slice(this.visibleStart, this.visibleStart + TrendingController.maxVisibleSongs);
            if (this.visibleSongs.length < TrendingController.maxVisibleSongs) {
                this.songsList.fetchNextChunk();
            }

            // Fetch the album colors for these songs.
            var albums = await this.albumCache.getAlbumsForSongs(this.visibleSongs);
            this.visibleSongs.forEach(s => {
                var albumForSong = albums.find(a => a.artist === s.artist && a.name === s.album);
                if (albumForSong) {
                    s.updateAlbumArtColors(albumForSong);
                }
            });
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
    }

    App.controller("TrendingController", TrendingController as any);
}