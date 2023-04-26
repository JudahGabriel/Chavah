var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * SongBatchService fetches a group of songs in a single remote call.
         * This makes the UI more responsive, quickly playing the next song without having to make extra remote calls.
         */
        var SongBatchService = /** @class */ (function () {
            function SongBatchService(audioPlayer, songApi, songRequestApi, accountApi) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.songApi = songApi;
                this.songRequestApi = songRequestApi;
                // event used for notifying components that songs are available
                this.songsBatch = new Rx.BehaviorSubject([]);
                // songs list used for caching.
                this.songsList = new Chavah.List(function () { return _this.fetchSongBatch(); }, "songsbatchV2", Chavah.SongApiService.songConverter, function (loadedSongs) { return _this.songsBatch.onNext(loadedSongs); });
                // Clear out the old songs batch. The old songs batch use the now-obsolete bitshuvafiles CDN.
                // Remove this code by 2020.
                window.localStorage.removeItem("songsbatch");
                // Listen for when we sign in. When that happens, we want to refresh our song batch.
                // Refreshing the batch is needed to update the song like statuses, etc. of the songs in the batch.
                accountApi.signedInState
                    .skip(1) // skip the current value
                    .distinctUntilChanged()
                    .subscribe(function (signedIn) { return _this.signedInChanged(signedIn); });
            }
            SongBatchService.prototype.playNext = function () {
                var _this = this;
                // Play any song remaining from the batch.
                var firstSongInList = this.songsList.items[0];
                if (firstSongInList) {
                    var songsAfterFirst = this.songsList.items.slice(1);
                    this.updateSongBatch(songsAfterFirst);
                    this.audioPlayer.playNewSong(firstSongInList);
                }
                else {
                    // Woops, we don't have any songs at all. Request just one (fast), then ask for a batch.
                    this.songApi
                        .chooseSong()
                        .then(function (song) { return _this.audioPlayer.playNewSong(song); });
                }
                var needMoreSongs = this.songsList.items.length < 3;
                if (needMoreSongs) {
                    this.songsList.fetch();
                }
            };
            /**
             * Plays a song that's in the song batch queue, but may not be the next item.
             * If the song is in the queued songs, it's moved to the next position in the queue and played immediately.
             * @param song
             */
            SongBatchService.prototype.playQueuedSong = function (song) {
                var songBatch = this.songsBatch.getValue();
                var songIndex = songBatch.indexOf(song);
                if (songIndex >= 0) {
                    // Pull it from the queue.
                    songBatch.splice(songIndex, 1);
                }
                // Put it as the next song and then play it.
                songBatch.splice(0, 0, song);
                this.updateSongBatch(songBatch);
                this.playNext();
            };
            SongBatchService.prototype.fetchSongBatch = function () {
                var _this = this;
                return this.songApi
                    .chooseSongBatch()
                    .then(function (results) {
                    // return the current song batch plus the new songs
                    var combinedBatch = _this.songsList.items
                        .concat(results)
                        .filter(function (s) { return !_this.songRequestApi.isSongPendingRequest(s.id); }); // exclude the song if it's already in the song request queue
                    _this.songsBatch.onNext(combinedBatch);
                    return combinedBatch;
                });
            };
            SongBatchService.prototype.signedInChanged = function (isSignedIn) {
                var hasBatchSongs = this.songsBatch.getValue().length > 0;
                if (isSignedIn && hasBatchSongs) {
                    // Discard the current batch and fetch a fresh batch.
                    this.updateSongBatch([]);
                    this.songsList.fetch();
                }
            };
            SongBatchService.prototype.updateSongBatch = function (songs) {
                var _a;
                this.songsList.items.length = 0;
                (_a = this.songsList.items).push.apply(_a, songs);
                this.songsList.cache();
                this.songsBatch.onNext(songs);
            };
            SongBatchService.$inject = [
                "audioPlayer",
                "songApi",
                "songRequestApi",
                "accountApi",
            ];
            return SongBatchService;
        }());
        Chavah.SongBatchService = SongBatchService;
        Chavah.App.service("songBatch", SongBatchService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongBatchService.js.map