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
            "songRequestApi"
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService,
            private songRequestApi: SongRequestApiService) {
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
                    .getSong()
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
                .getSongBatch()
                .then(songs => {
                var existingSongBatch = this.songsBatch.getValue();
                    var freshSongs = songs
                        .filter(s => existingSongBatch.map(s => s.id).indexOf(s.id) === -1)
                        .filter(s => !this.songRequestApi.isSongPendingRequest(s.id));
                    this.songsBatch.onNext(existingSongBatch.concat(freshSongs));
                });
        }
    }

    App.service("songBatch", SongBatchService);
}