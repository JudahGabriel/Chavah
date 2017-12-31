var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var NowPlayingController = /** @class */ (function () {
            function NowPlayingController(songApi, songBatch, audioPlayer, albumCache, initConfig, appNav, accountApi, $q, sharing) {
                var _this = this;
                this.songApi = songApi;
                this.songBatch = songBatch;
                this.audioPlayer = audioPlayer;
                this.albumCache = albumCache;
                this.initConfig = initConfig;
                this.appNav = appNav;
                this.accountApi = accountApi;
                this.$q = $q;
                this.sharing = sharing;
                this.songs = [];
                this.trending = [];
                this.recent = [];
                this.popular = [];
                this.likes = [];
                this.isFetchingAlbums = false;
                this.disposed = new Rx.Subject();
                this.audioPlayer.song
                    .takeUntil(this.disposed)
                    .subscribeOnNext(function (song) { return _this.nextSongBeginning(song); });
                this.audioPlayer.songCompleted
                    .takeUntil(this.disposed).throttle(5000)
                    .subscribe(function (song) { return _this.songCompleted(song); });
                this.songBatch.songsBatch
                    .takeUntil(this.disposed)
                    .subscribeOnNext(function () { return _this.songs = _this.getSongs(); });
                // Recent plays we fetch once, at init. Afterwards, we update it ourselves.
                this.fetchRecentPlays();
                this.setupRecurringFetches();
                if (initConfig.embed) {
                    // If we're embedded on another page, queue up the song we're told to play.
                    // Don't play it automatically, though, because there may be multiple embeds on the same page.
                    //temp fix??? at least this will display the image for the emebed song
                    this.audioPlayer.playNewSong(this.initConfig.song);
                    this.audioPlayer.pause();
                }
                else {
                    // Play the next song if we don't already have one playing.
                    // We don't have one playing when first loading the UI.
                    var hasCurrentSong = this.audioPlayer.song.getValue();
                    if (!hasCurrentSong) {
                        if (!this.playSongInUrlQuery()) {
                            this.songBatch.playNext();
                        }
                    }
                }
            }
            Object.defineProperty(NowPlayingController.prototype, "currentArtistDonateUrl", {
                get: function () {
                    var song = this.currentSong;
                    if (song && song.artist) {
                        return "#/donate/" + encodeURIComponent(song.artist);
                    }
                    return "#/donate";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        if (this.currentSong.isShowingEmbedCode) {
                            return this.sharing.getEmbedCode(this.currentSong.id);
                        }
                        return this.sharing.shareUrl(this.currentSong.id);
                    }
                    return "";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongTwitterShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        return this.sharing.twitterShareUrl(this.currentSong);
                    }
                    return "#";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongFacebookShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        return this.sharing.facebookShareUrl(this.currentSong);
                    }
                    return "#";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongGooglePlusShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        return this.sharing.googlePlusShareUrl(this.currentSong.id);
                    }
                    return "#";
                },
                enumerable: true,
                configurable: true
            });
            NowPlayingController.prototype.getEditSongUrl = function () {
                if (this.currentSong) {
                    if (this.accountApi.isSignedIn) {
                        return this.appNav.getEditSongUrl(this.currentSong.id);
                    }
                    return this.appNav.promptSignInUrl;
                }
                return "#";
            };
            NowPlayingController.prototype.$onDestroy = function () {
                if (this.recurringFetchHandle) {
                    clearTimeout(this.recurringFetchHandle);
                }
                this.disposed.onNext(true);
            };
            NowPlayingController.prototype.getSongs = function () {
                var songs = [
                    this.audioPlayer.song.getValue(),
                    this.songBatch.songsBatch.getValue()[0],
                    this.songBatch.songsBatch.getValue()[1],
                    this.songBatch.songsBatch.getValue()[2],
                    this.songBatch.songsBatch.getValue()[3]
                ].filter(function (s) { return !!s && s.name; });
                this.fetchAlbumColors(songs);
                return songs;
            };
            NowPlayingController.prototype.getSongOrPlaceholder = function (song) {
                return song || Chavah.Song.empty();
            };
            NowPlayingController.prototype.fetchAlbumColors = function (songs) {
                var _this = this;
                var songsNeedingAlbumSwatch = songs
                    .filter(function (s) { return !s.hasSetAlbumArtColors && s.id !== "songs/0"; });
                if (songsNeedingAlbumSwatch.length > 0) {
                    this.isFetchingAlbums = true;
                    this.albumCache.getAlbumsForSongs(songsNeedingAlbumSwatch)
                        .then(function (albums) { return _this.populateSongsWithAlbumColors(albums); });
                }
            };
            NowPlayingController.prototype.populateSongsWithAlbumColors = function (albums) {
                var _this = this;
                albums.forEach(function (a) {
                    var songsForAlbum = _this.getAllSongsOnScreen()
                        .filter(function (s) { return s.albumId && s.albumId.toLowerCase() === a.id.toLowerCase(); });
                    songsForAlbum.forEach(function (s) { return s.updateAlbumArtColors(a); });
                });
            };
            NowPlayingController.prototype.setupRecurringFetches = function () {
                var _this = this;
                var songFetchesTask = this.songApi.getTrendingSongs(0, 3)
                    .then(function (results) { return _this.updateSongList(_this.trending, results.items); })
                    .then(function () { return _this.songApi.getPopularSongs(3); })
                    .then(function (results) { return _this.updateSongList(_this.popular, results); })
                    .then(function () { return _this.songApi.getLikes(3); })
                    .then(function (results) { return _this.updateSongList(_this.likes, results); })
                    .finally(function () {
                    _this.fetchAlbumColors(_this.getAllSongsOnScreen());
                    // Call ourselves every 30s.
                    _this.recurringFetchHandle = setTimeout(function () { return _this.setupRecurringFetches(); }, 30000);
                });
            };
            NowPlayingController.prototype.fetchRecentPlays = function () {
                var _this = this;
                this.songApi.getRecentPlays(3)
                    .then(function (results) {
                    results.forEach(function (s) { return _this.recent.push(s); });
                    if (_this.recent.length > 3) {
                        _this.recent.length = 3;
                    }
                });
            };
            NowPlayingController.prototype.updateSongList = function (target, source) {
                target.splice.apply(target, [0, target.length].concat(source));
                this.fetchAlbumColors(this.getAllSongsOnScreen());
            };
            NowPlayingController.prototype.getAllSongsOnScreen = function () {
                return this.songs.concat(this.recent, this.trending, this.likes, this.popular);
            };
            NowPlayingController.prototype.nextSongBeginning = function (song) {
                this.songs = this.getSongs();
                if (song) {
                    if (this.currentSong) {
                        this.recent.splice(0, 0, this.currentSong);
                        if (this.recent.length > 3) {
                            this.recent.length = 3;
                        }
                    }
                    this.currentSong = song;
                }
            };
            NowPlayingController.prototype.songCompleted = function (song) {
                if (song) {
                    this.songApi.songCompleted(song.id);
                }
            };
            NowPlayingController.prototype.songClicked = function (song) {
                if (song !== this.currentSong) {
                    song.setSolePickReason(Chavah.SongPick.YouRequestedSong);
                    var songBatch = this.songBatch.songsBatch.getValue();
                    var songIndex = songBatch.indexOf(song);
                    if (songIndex >= 0) {
                        songBatch.splice(songIndex, 1);
                        songBatch.splice(0, 0, song);
                        this.songBatch.playNext();
                    }
                }
            };
            NowPlayingController.prototype.playSongFromCurrentArtist = function () {
                if (this.currentSong) {
                    this.audioPlayer.playSongFromArtist(this.currentSong.artist);
                }
            };
            NowPlayingController.prototype.playSongFromCurrentAlbum = function () {
                if (this.currentSong) {
                    this.audioPlayer.playSongFromAlbum(this.currentSong.album);
                }
            };
            NowPlayingController.prototype.playSongWithTag = function (tag) {
                this.audioPlayer.playSongWithTag(tag);
            };
            NowPlayingController.prototype.playSongInUrlQuery = function () {
                // Does the user want us to play a certain song/album/artist?
                var songId = this.getUrlQueryOrNull("song");
                if (songId) {
                    this.audioPlayer.playSongById(songId);
                    return true;
                }
                var artist = this.getUrlQueryOrNull("artist");
                var album = this.getUrlQueryOrNull("album");
                if (artist && album) {
                    this.audioPlayer.playSongFromArtistAndAlbum(artist, album);
                    return true;
                }
                if (album) {
                    this.audioPlayer.playSongFromAlbum(album);
                    return true;
                }
                if (artist) {
                    this.audioPlayer.playSongFromArtist(artist);
                    return true;
                }
                return false;
            };
            NowPlayingController.prototype.copyShareUrl = function () {
                var shareUrlInput = document.querySelector("#currentSongShareLink");
                shareUrlInput.select();
                document.execCommand("copy");
            };
            NowPlayingController.prototype.getUrlQueryOrNull = function (term) {
                var queryString = window.location.search;
                if (queryString) {
                    var allTerms = queryString.split("&");
                    var termWithEquals_1 = term + "=";
                    var termAtBeginning_1 = "?" + termWithEquals_1;
                    var match = allTerms.find(function (t) { return t.startsWith(termWithEquals_1) || t.startsWith(termAtBeginning_1); });
                    if (match) {
                        var termValue = match.substr(match.indexOf("=") + 1);
                        if (termValue) {
                            var termValueWithoutPlus = termValue.split("+").join(" "); // Replace + with space.
                            return decodeURIComponent(termValueWithoutPlus);
                        }
                    }
                }
                return null;
            };
            NowPlayingController.$inject = [
                "songApi",
                "songBatch",
                "audioPlayer",
                "albumCache",
                "initConfig",
                "appNav",
                "accountApi",
                "$q",
                "sharing",
            ];
            return NowPlayingController;
        }());
        Chavah.NowPlayingController = NowPlayingController;
        Chavah.App.controller("NowPlayingController", NowPlayingController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=NowPlayingController.js.map