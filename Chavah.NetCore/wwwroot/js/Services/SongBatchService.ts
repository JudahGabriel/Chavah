namespace BitShuva.Chavah {
    /**
     * SongBatchService fetches a group of songs in a single remote call.
     * This makes the UI more responsive, quickly playing the next song without having to make extra remote calls.
     */
    export class SongBatchService {
        // event used for notifying components that songs are available
        songsBatch = new Rx.BehaviorSubject<Song[]>([]);

        // songs list used for caching.
        private songsList = new List<Song>(() => this.fetchSongBatch(), "songsbatch", SongApiService.songConverter, loadedSongs => this.songsBatch.onNext(loadedSongs));
        
        static $inject = [
            "audioPlayer",
            "songApi",
            "songRequestApi",
            "accountApi",
        ];

        constructor(
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService,
            private songRequestApi: SongRequestApiService,
            accountApi: AccountService) {

            // Listen for when we sign in. When that happens, we want to refresh our song batch.
            // Refreshing the batch is needed to update the song like statuses, etc. of the songs in the batch.
            accountApi.signedIn
                .skip(1) // skip the current value
                .distinctUntilChanged()
                .subscribe(signedIn => this.signedInChanged(signedIn));
        }

        playNext() {
            // Play any song remaining from the batch.
            const firstSongInList: Song | undefined = this.songsList.items[0];
            if (firstSongInList) {
                const songsAfterFirst = this.songsList.items.slice(1);
                this.updateSongBatch(songsAfterFirst);
                this.audioPlayer.playNewSong(firstSongInList);
            } else {
                // Woops, we don't have any songs at all. Request just one (fast), then ask for a batch.
                this.songApi
                    .chooseSong()
                    .then(song => this.audioPlayer.playNewSong(song));
            }

            const needMoreSongs = this.songsList.items.length < 3;
            if (needMoreSongs) {
                this.songsList.fetch();
            }
        }

        /**
         * Plays a song that's in the song batch queue, but may not be the next item.
         * If the song is in the queued songs, it's moved to the next position in the queue and played immediately.
         * @param song
         */
        playQueuedSong(song: Song) {
            const songBatch = this.songsBatch.getValue();
            const songIndex = songBatch.indexOf(song);
            if (songIndex >= 0) {
                // Pull it from the queue.
                songBatch.splice(songIndex, 1);
            }

            // Put it as the next song and then play it.
            songBatch.splice(0, 0, song);
            this.updateSongBatch(songBatch);
            this.playNext();
        }

        private fetchSongBatch(): ng.IPromise<Song[]> {
            return this.songApi
                .chooseSongBatch()
                .then(results => {
                    // return the current song batch plus the new songs
                    const combinedBatch = this.songsList.items
                        .concat(results)
                        .filter(s => !this.songRequestApi.isSongPendingRequest(s.id)) // exclude the song if it's already in the song request queue
                    this.songsBatch.onNext(combinedBatch);
                    return combinedBatch;
                });
        }

        private signedInChanged(isSignedIn: boolean) {
            let hasBatchSongs = this.songsBatch.getValue().length > 0;
            if (isSignedIn && hasBatchSongs) {
                // Discard the current batch and fetch a fresh batch.
                this.updateSongBatch([]);
                this.songsList.fetch();
            }
        }

        private updateSongBatch(songs: Song[]) {
            this.songsList.items.length = 0;
            this.songsList.items.push(...songs);
            this.songsList.cache();
            this.songsBatch.onNext(songs);
        }
    }

    App.service("songBatch", SongBatchService);
}
