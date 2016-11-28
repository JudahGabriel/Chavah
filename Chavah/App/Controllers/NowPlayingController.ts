namespace BitShuva.Chavah {
    export class NowPlayingController {

        static $inject = [
            "songBatch",
            "audioPlayer",
            "albumApi",
            "$q"
        ];

        songs: Song[] = [];
        isFetchingAlbums = false;

        constructor(
            private songBatch: SongBatchService,
            private audioPlayer: AudioPlayerService,
            private albumApi: AlbumApiService,
            private $q: ng.IQService) {

            this.audioPlayer.song.subscribeOnNext(song => this.songs = this.getSongs());
            this.songBatch.songsBatch.subscribeOnNext(() => this.songs = this.getSongs());
        }
        
        private getSongs(): Song[] {
            var songs = [
                this.audioPlayer.song.getValue()!,
                this.songBatch.songsBatch.getValue()[0],
                this.songBatch.songsBatch.getValue()[1],
                this.songBatch.songsBatch.getValue()[2],
                this.songBatch.songsBatch.getValue()[3]
            ].filter(s => !!s && s.name);
            this.fetchAlbumColors(songs);
            return songs;
        }

        getSongOrPlaceholder(song: Song | null): Song {
            return song || Song.empty();
        }

        fetchAlbumColors(songs: Song[]) {
            if (!this.isFetchingAlbums) {
                var songIdsNeedingAlbumSwatch = songs
                    .filter(s => !s.hasSetAlbumArtColors && s.id !== "songs/0")
                    .map(s => s.id);
                if (songIdsNeedingAlbumSwatch.length > 0) {
                    this.isFetchingAlbums = true;
                    this.albumApi.getAlbumsForSongs(songIdsNeedingAlbumSwatch)
                        .then(albums => this.populateSongsWithAlbumColors(albums))
                        .finally(() => this.isFetchingAlbums = false);
                }
            }
        }

        populateSongsWithAlbumColors(albums: Album[]) {
            albums.forEach(a => {
                var songsForAlbum = this.songs.filter(s => s.albumArtUri === a.albumArtUri);
                songsForAlbum.forEach(s => s.updateAlbumArtColors(a));
            });
        }
    }

    App.controller("NowPlayingController", NowPlayingController);
}