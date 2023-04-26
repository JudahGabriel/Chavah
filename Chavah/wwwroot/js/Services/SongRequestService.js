var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongRequestApiService = /** @class */ (function () {
            function SongRequestApiService(httpApi, audioPlayer, songApi, homeViewModel, accountApi) {
                var _this = this;
                this.httpApi = httpApi;
                this.audioPlayer = audioPlayer;
                this.songApi = songApi;
                this.homeViewModel = homeViewModel;
                this.accountApi = accountApi;
                this.pendingSongRequestIds = [];
                this.hasPlayedRequestAnnouncement = false;
                this.anonUserPlayedSongIds = null;
                this.lastFetchRequestsTime = null;
                // When the user signs in, we need to let the server know that we 
                // may have heard some song requests while signed out.
                this.accountApi.signedInState
                    .distinctUntilChanged()
                    .where(function (i) { return i === true; })
                    .subscribe(function () { return _this.userSignedIn(); });
                // Deprecated: the album art cache is no more. Remove it from the local store.
                // Remove this code after 6/1/2019
                localStorage.removeItem("album-art-cache");
            }
            SongRequestApiService.prototype.hasPendingRequest = function () {
                var _this = this;
                var hasPendingRequest = this.pendingSongRequestIds.length > 0;
                if (this.pendingSongRequestIds.length === 0) {
                    setTimeout(function () { return _this.fetchPendingSongRequests(); }, 5000);
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
                    var songRequestNumbers = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                    // tslint:disable-next-line:max-line-length
                    var songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                    var songRequestUrl = this.homeViewModel.soundEffects + "/" + songRequestName;
                    this.audioPlayer.playNewUri(songRequestUrl);
                }
                else {
                    // We've already played the song req announcement - yay!
                    // Now we actually played the requested song.
                    this.hasPlayedRequestAnnouncement = false;
                    var pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                    var currentSong_1 = this.audioPlayer.song.getValue();
                    this.songApi.getSongById(pendingRequestedSongId, Chavah.SongPick.SomeoneRequestedSong)
                        .then(function (song) {
                        var isStillWaitingForSong = _this.audioPlayer.song.getValue() === currentSong_1;
                        if (isStillWaitingForSong && song) {
                            _this.audioPlayer.playNewSong(song);
                            _this.addAnonUserPlayedSong(song.id);
                        }
                    });
                }
            };
            SongRequestApiService.prototype.getRandomRecentlyRequestedSongs = function (count) {
                var args = {
                    count: count
                };
                return this.httpApi.query("/api/songRequests/getRandomRecentlyRequestedSongs", args, Chavah.SongApiService.songListConverter);
            };
            //removePendingSongRequest(songId: string) {
            //    this.pendingSongRequestIds = this.pendingSongRequestIds.filter(id => id !== songId);
            //}
            SongRequestApiService.prototype.fetchPendingSongRequests = function () {
                // If we checked in the last 30 seconds, don't check again.
                var sixtySecondsInMS = 30000;
                var now = Date.now();
                var shouldAskServer = this.lastFetchRequestsTime === null || now - this.lastFetchRequestsTime > sixtySecondsInMS;
                if (shouldAskServer) {
                    this.lastFetchRequestsTime = now;
                    // Are we signed in? Get a pending song request for our user.
                    if (this.accountApi.isSignedIn) {
                        this.fetchRequestForCurrentUser();
                    }
                    else {
                        // Not signed in? Find recent song requests that we haven't listened to.
                        this.fetchRequestForAnonymous();
                    }
                }
            };
            SongRequestApiService.prototype.fetchRequestForCurrentUser = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var songId;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.httpApi.query("/api/songRequests/getPending")];
                            case 1:
                                songId = _a.sent();
                                if (songId && this.pendingSongRequestIds.indexOf(songId) === -1) {
                                    this.pendingSongRequestIds.push(songId);
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
            SongRequestApiService.prototype.fetchRequestForAnonymous = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var recentRequestSongIds, playedSongIds, unplayedSongIds, unplayedNotYetPending, lastUnplayedNotYetPending;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.httpApi.query("/api/songRequests/getRecentRequestedSongIds")];
                            case 1:
                                recentRequestSongIds = _a.sent();
                                playedSongIds = this.getAnonUserPlayedSongIds();
                                unplayedSongIds = _.without.apply(_, __spreadArray([recentRequestSongIds], playedSongIds));
                                unplayedNotYetPending = _.without.apply(_, __spreadArray([unplayedSongIds], this.pendingSongRequestIds));
                                lastUnplayedNotYetPending = _.last(unplayedNotYetPending);
                                if (lastUnplayedNotYetPending) {
                                    this.pendingSongRequestIds.push(lastUnplayedNotYetPending);
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
            SongRequestApiService.prototype.getAnonUserPlayedSongIds = function () {
                if (!this.anonUserPlayedSongIds) {
                    // Rehydrate them from local storage. 
                    // We need to store them in local storage, otherwise the user 
                    // may hear duplicate song requests if he closes Chavah and 
                    // quickly reopens it.
                    try {
                        var json = localStorage.getItem(SongRequestApiService.anonUserPlayedSongIdsKey);
                        if (json) {
                            this.anonUserPlayedSongIds = JSON.parse(json);
                        }
                    }
                    catch (error) {
                        console.log("failed to rehydrate anonymous user's played song IDs", error);
                        this.anonUserPlayedSongIds = [];
                    }
                }
                if (!this.anonUserPlayedSongIds) {
                    this.anonUserPlayedSongIds = [];
                }
                return this.anonUserPlayedSongIds;
            };
            SongRequestApiService.prototype.addAnonUserPlayedSong = function (songId) {
                // If we're anonymous, update the list of played song IDs.
                if (!this.accountApi.isSignedIn) {
                    var playedSongIds = this.getAnonUserPlayedSongIds();
                    playedSongIds.unshift(songId);
                    this.updateAnonymousUserPlayedSongIds(this.getAnonUserPlayedSongIds());
                }
            };
            SongRequestApiService.prototype.updateAnonymousUserPlayedSongIds = function (songIds) {
                if (!songIds) {
                    songIds = [];
                }
                var maxPlayedSongs = 10;
                if (songIds.length > maxPlayedSongs) {
                    songIds.length = 10;
                }
                try {
                    localStorage.setItem(SongRequestApiService.anonUserPlayedSongIdsKey, JSON.stringify(songIds));
                }
                catch (error) {
                    console.log("Unable to store anonymous user song IDs", error);
                }
                this.anonUserPlayedSongIds = songIds;
            };
            SongRequestApiService.prototype.userSignedIn = function () {
                var songsPlayedWhileAnonymous = this.getAnonUserPlayedSongIds();
                if (songsPlayedWhileAnonymous && songsPlayedWhileAnonymous.length) {
                    this.httpApi.post("/api/songRequests/markAsPlayed", songsPlayedWhileAnonymous);
                }
            };
            SongRequestApiService.anonUserPlayedSongIdsKey = "songrequests-anonUserPlayedSongIds";
            SongRequestApiService.$inject = [
                "httpApi",
                "audioPlayer",
                "songApi",
                "homeViewModel",
                "accountApi"
            ];
            return SongRequestApiService;
        }());
        Chavah.SongRequestApiService = SongRequestApiService;
        Chavah.App.service("songRequestApi", SongRequestApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongRequestService.js.map