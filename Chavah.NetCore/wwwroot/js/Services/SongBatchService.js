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
                this.accountApi = accountApi;
                this.songsBatch = new Rx.BehaviorSubject([]);
                // Listen for when we sign in. When that happens, we want to refresh our song batch.
                // Refreshing the batch is needed to update the song like statuses, etc. of the songs in the batch.
                accountApi.signedIn
                    .distinctUntilChanged()
                    .subscribe(function (signedIn) { return _this.signedInChanged(signedIn); });
            }
            SongBatchService.prototype.playNext = function () {
                var _this = this;
                // Play any song remaining from the batch.
                if (this.songsBatch.getValue().length > 0) {
                    var song = this.songsBatch.getValue().splice(0, 1)[0]; // Remove the top item.
                    this.songsBatch.onNext(this.songsBatch.getValue());
                    this.audioPlayer.playNewSong(song);
                }
                else {
                    // Woops, we don't have any songs at all. Request just one (fast), then ask for a batch.
                    this.songApi
                        .chooseSong()
                        .then(function (song) {
                        _this.audioPlayer.playNewSong(song);
                        _this.fetchSongBatch();
                    });
                }
                var needMoreSongs = this.songsBatch.getValue().length < 5;
                if (needMoreSongs) {
                    this.fetchSongBatch();
                }
            };
            SongBatchService.prototype.fetchSongBatch = function () {
                var _this = this;
                this.songApi
                    .chooseSongBatch()
                    .then(function (songs) {
                    var existingSongBatch = _this.songsBatch.getValue();
                    var freshSongs = songs
                        .filter(function (s) { return existingSongBatch.map(function (s) { return s.id; }).indexOf(s.id) === -1; })
                        .filter(function (s) { return !_this.songRequestApi.isSongPendingRequest(s.id); });
                    _this.songsBatch.onNext(existingSongBatch.concat(freshSongs));
                });
            };
            SongBatchService.prototype.signedInChanged = function (isSignedIn) {
                var hasBatchSongs = this.songsBatch.getValue().length > 0;
                if (isSignedIn && hasBatchSongs) {
                    // Discard the current batch and fetch a fresh batch.
                    this.songsBatch.onNext([]);
                    this.fetchSongBatch();
                }
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