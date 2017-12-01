var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TrendingController = (function () {
            function TrendingController(songApi, albumCache, audioPlayer) {
                var _this = this;
                this.songApi = songApi;
                this.albumCache = albumCache;
                this.audioPlayer = audioPlayer;
                this.songsList = new Chavah.PagedList(function (skip, take) { return _this.songApi
                    .getTrendingSongs(skip, take); }, undefined, function (items) { return _this.calcVisibleSongs(items); });
                this.visibleSongs = [];
                this.visibleStart = 0;
                this.songsList.fetchNextChunk();
            }
            Object.defineProperty(TrendingController.prototype, "canGoPrevious", {
                get: function () {
                    return this.visibleStart > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TrendingController.prototype, "canGoNext", {
                get: function () {
                    return this.songsList.itemsTotalCount !== null && this.visibleStart < (this.songsList.itemsTotalCount - 1);
                },
                enumerable: true,
                configurable: true
            });
            TrendingController.prototype.calcVisibleSongs = function (items) {
                return __awaiter(this, void 0, void 0, function () {
                    var albums;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.visibleSongs = items.slice(this.visibleStart, this.visibleStart + TrendingController.maxVisibleSongs);
                                if (this.visibleSongs.length < TrendingController.maxVisibleSongs) {
                                    this.songsList.fetchNextChunk();
                                }
                                return [4 /*yield*/, this.albumCache.getAlbumsForSongs(this.visibleSongs)];
                            case 1:
                                albums = _a.sent();
                                this.visibleSongs.forEach(function (s) {
                                    var albumForSong = albums.find(function (a) { return a.artist === s.artist && a.name === s.album; });
                                    if (albumForSong) {
                                        s.updateAlbumArtColors(albumForSong);
                                    }
                                });
                                return [2 /*return*/];
                        }
                    });
                });
            };
            TrendingController.prototype.next = function () {
                if (this.canGoNext) {
                    this.visibleStart++;
                    this.calcVisibleSongs(this.songsList.items);
                }
            };
            TrendingController.prototype.previous = function () {
                if (this.canGoPrevious) {
                    this.visibleStart--;
                    this.calcVisibleSongs(this.songsList.items);
                }
            };
            TrendingController.prototype.playSong = function (song) {
                this.audioPlayer.playSongById(song.id);
            };
            return TrendingController;
        }());
        TrendingController.maxVisibleSongs = 5;
        TrendingController.$inject = [
            "songApi",
            "albumCache",
            "audioPlayer",
        ];
        Chavah.TrendingController = TrendingController;
        Chavah.App.controller("TrendingController", TrendingController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=TrendingController.js.map