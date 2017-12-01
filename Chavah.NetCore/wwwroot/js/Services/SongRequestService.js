var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongRequestApiService = (function () {
            function SongRequestApiService(httpApi, audioPlayer, songApi) {
                this.httpApi = httpApi;
                this.audioPlayer = audioPlayer;
                this.songApi = songApi;
                this.pendingSongRequestIds = [];
                this.hasPlayedRequestAnnouncement = false;
            }
            SongRequestApiService.prototype.hasPendingRequest = function () {
                var _this = this;
                var hasPendingRequest = this.pendingSongRequestIds.length > 0;
                if (this.pendingSongRequestIds.length === 0) {
                    setTimeout(function () { return _this.fetchPendingSongRequests(); }, 2000);
                }
                return hasPendingRequest;
            };
            SongRequestApiService.prototype.isSongPendingRequest = function (songId) {
                return this.pendingSongRequestIds.indexOf(songId) !== -1;
            };
            SongRequestApiService.prototype.requestSong = function (song) {
                this.pendingSongRequestIds.unshift(song.id);
                this.hasPlayedRequestAnnouncement = false;
                var args = {
                    songId: song.id,
                };
                return this.httpApi.postUriEncoded("/api/songRequests/requestsong", args);
            };
            SongRequestApiService.prototype.playRequest = function () {
                var _this = this;
                if (!this.hasPendingRequest()) {
                    throw new Error("There was no pending song request.");
                }
                if (!this.hasPlayedRequestAnnouncement) {
                    this.hasPlayedRequestAnnouncement = true;
                    var songRequestNumbers = [1, 3, 4, 5, 6, 7, 8, 9, 10];
                    // tslint:disable-next-line:max-line-length
                    var songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                    var songRequestUrl = "https://bitshuvafiles01.com/chavah/soundEffects/" + songRequestName;
                    this.audioPlayer.playNewUri(songRequestUrl);
                }
                else {
                    this.hasPlayedRequestAnnouncement = false;
                    var pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                    var currentSong_1 = this.audioPlayer.song.getValue();
                    this.songApi.getSongById(pendingRequestedSongId, Chavah.SongPick.SomeoneRequestedSong)
                        .then(function (song) {
                        var isStillWaitingForSong = _this.audioPlayer.song.getValue() === currentSong_1;
                        if (isStillWaitingForSong && song) {
                            _this.audioPlayer.playNewSong(song);
                        }
                    });
                }
            };
            SongRequestApiService.prototype.removePendingSongRequest = function (songId) {
                this.pendingSongRequestIds = this.pendingSongRequestIds.filter(function (id) { return id !== songId; });
            };
            SongRequestApiService.prototype.fetchPendingSongRequests = function () {
                var _this = this;
                return this.httpApi.query("/api/songRequests/getPending")
                    .then(function (songIdOrNull) {
                    if (songIdOrNull && _this.pendingSongRequestIds.indexOf(songIdOrNull) === -1) {
                        _this.pendingSongRequestIds.push(songIdOrNull);
                    }
                });
            };
            return SongRequestApiService;
        }());
        SongRequestApiService.$inject = [
            "httpApi",
            "audioPlayer",
            "songApi",
        ];
        Chavah.SongRequestApiService = SongRequestApiService;
        Chavah.App.service("songRequestApi", SongRequestApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongRequestService.js.map