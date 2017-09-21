namespace BitShuva.Chavah {
    /**
     * SongBatchService fetches a group of songs in a single remote call.
     * This makes the UI more responsive, quickly playing the next song without having to make extra remote calls.
     */
    export class SongBatchService {

        songsBatch = new Rx.BehaviorSubject<Song[]>([]);

        static $inject = [
            "audioPlayer",
            "songApi",
            "songRequestApi",
            "accountApi"
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService,
            private songRequestApi: SongRequestApiService,
            private accountApi: AccountService) {

            // Listen for when we sign in. When that happens, we want to refresh our song batch.
            // Refreshing the batch is needed to update the song like statuses, etc. of the songs in the batch.
            accountApi.signedIn
                .distinctUntilChanged()
                .subscribe(signedIn => this.signedInChanged(signedIn));
        }

        playNext() {
            // Play any song remaining from the batch.
            if (this.songsBatch.getValue().length > 0) {
                var song = this.songsBatch.getValue().splice(0, 1)[0]; // Remove the top item.
                this.songsBatch.onNext(this.songsBatch.getValue());
                this.audioPlayer.playNewSong(song);
            } else {
                // Woops, we don't have any songs at all. Request just one (fast), then ask for a batch.
                this.songApi
                    .chooseSong()
                    .then(song => {
                        this.audioPlayer.playNewSong(song);
                        this.fetchSongBatch();
                    });
            }

            var needMoreSongs = this.songsBatch.getValue().length < 5;
            if (needMoreSongs) {
                this.fetchSongBatch();
            }
        }

        private fetchSongBatch() {
            this.songApi
                .chooseSongBatch()
                .then(songs => {
                    var existingSongBatch = this.songsBatch.getValue();
                        var freshSongs = songs
                            .filter(s => existingSongBatch.map(s => s.id).indexOf(s.id) === -1)
                            .filter(s => !this.songRequestApi.isSongPendingRequest(s.id));
                        this.songsBatch.onNext(existingSongBatch.concat(freshSongs));
                });
        }

        private signedInChanged(isSignedIn: boolean) {
            var hasBatchSongs = this.songsBatch.getValue().length > 0;
            if (isSignedIn && hasBatchSongs) {
                // Discard the current batch and fetch a fresh batch.
                this.songsBatch.onNext([]);
                this.fetchSongBatch();
            }
        }
    }

    App.service("songBatch", SongBatchService);
}