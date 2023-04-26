var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var NowPlayingController = /** @class */ (function () {
            function NowPlayingController(songApi, songBatch, audioPlayer, homeViewModel, appNav, accountApi, commentThreadApi, sharing, songRequestApi, $q) {
                var _this = this;
                this.songApi = songApi;
                this.songBatch = songBatch;
                this.audioPlayer = audioPlayer;
                this.homeViewModel = homeViewModel;
                this.appNav = appNav;
                this.accountApi = accountApi;
                this.commentThreadApi = commentThreadApi;
                this.sharing = sharing;
                this.songRequestApi = songRequestApi;
                this.$q = $q;
                this.trending = new Chavah.List(function () { return _this.songApi.getTrendingSongs(0, 3).then(function (results) { return results.items; }); }, "trending", Chavah.SongApiService.songConverter);
                this.likes = new Chavah.List(function () { return _this.songApi.getRandomLikedSongs(3); }, "mylikes", Chavah.SongApiService.songConverter);
                this.recent = new Chavah.List(function () { return _this.getRecentPlays(); }, "recent", Chavah.SongApiService.songConverter);
                this.popular = new Chavah.List(function () { return _this.songApi.getRandomPopular(3); }, "popular", Chavah.SongApiService.songConverter);
                this.newSongs = new Chavah.List(function () { return _this.songApi.getRandomNewSongs(3); }, "newSongs", Chavah.SongApiService.songConverter);
                this.recentSongRequests = new Chavah.List(function () { return _this.songRequestApi.getRandomRecentlyRequestedSongs(3); }, "recentRequests", Chavah.SongApiService.songConverter);
                this.songs = [];
                this.isFetchingAlbums = false;
                this.disposed = new Rx.Subject();
                this.commentThread = null;
                this.isLoadingCommentThread = false;
                this.newCommentText = "";
                this.canNativeShare = !!navigator["share"];
                this.audioPlayer.song
                    .takeUntil(this.disposed)
                    .subscribeOnNext(function (song) { return _this.nextSongBeginning(song); });
                this.audioPlayer.songCompleted
                    .takeUntil(this.disposed).throttle(5000)
                    .subscribe(function (song) { return _this.songCompleted(song); });
                this.songBatch.songsBatch
                    .takeUntil(this.disposed)
                    .subscribeOnNext(function () { return _this.songs = _this.getSongs(); });
                if (homeViewModel.embed) {
                    // If we're embedded on another page, queue up the song we're told to play.
                    // Don't play it automatically, though, because there may be multiple embeds on the same page.
                    if (this.homeViewModel.song) {
                        this.audioPlayer.playNewSong(new Chavah.Song(this.homeViewModel.song));
                        this.audioPlayer.pause();
                    }
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
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "isCurrentSongPaused", {
                get: function () {
                    return !!this.currentSong && this.audioPlayer.status.getValue() === Chavah.AudioStatus.Paused;
                },
                enumerable: false,
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
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongTwitterShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        return this.sharing.twitterShareUrl(this.currentSong);
                    }
                    return "#";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongSmsShareUrl", {
                get: function () {
                    return this.currentSong ? this.sharing.smsShareUrl(this.currentSong) : "#";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongWhatsAppShareUrl", {
                get: function () {
                    return this.currentSong ? this.sharing.whatsAppShareUrl(this.currentSong) : "#";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongFacebookShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        return this.sharing.facebookShareUrl(this.currentSong);
                    }
                    return "#";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "commentsTitle", {
                get: function () {
                    if (!this.currentSong || this.currentSong.commentCount === 0) {
                        return "Comments";
                    }
                    if (this.currentSong.commentCount === 1) {
                        return "1 comment";
                    }
                    return this.currentSong.commentCount + " comments";
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentUserProfileUrl", {
                get: function () {
                    return "/api/cdn/getuserprofile?userId=" + (this.accountApi.currentUser ? encodeURIComponent(this.accountApi.currentUser.id) : '');
                },
                enumerable: false,
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
            NowPlayingController.prototype.$onInit = function () {
                if (this.currentSong) {
                    this.currentSong.areCommentsExpanded = false;
                }
            };
            NowPlayingController.prototype.$onDestroy = function () {
                if (this.recurringFetchHandle) {
                    clearTimeout(this.recurringFetchHandle);
                }
                this.disposed.onNext(true);
            };
            NowPlayingController.prototype.pauseOverlayClicked = function () {
                if (this.currentSong && this.audioPlayer.status.getValue() === Chavah.AudioStatus.Paused) {
                    this.audioPlayer.resume();
                }
            };
            NowPlayingController.prototype.getSongs = function () {
                var songs = [
                    this.audioPlayer.song.getValue(),
                    this.songBatch.songsBatch.getValue()[0],
                    this.songBatch.songsBatch.getValue()[1],
                    this.songBatch.songsBatch.getValue()[2],
                    this.songBatch.songsBatch.getValue()[3]
                ].filter(function (s) { return !!s && s.name; });
                return songs;
            };
            NowPlayingController.prototype.getSongOrPlaceholder = function (song) {
                return song || Chavah.Song.empty();
            };
            NowPlayingController.prototype.getRecentPlays = function () {
                if (this.accountApi.isSignedIn) {
                    return this.songApi.getRecentPlays(3);
                }
                // Not signed in? Use whatever we have locally for recent.
                return this.$q.resolve(this.recent.items);
            };
            NowPlayingController.prototype.nextSongBeginning = function (song) {
                this.songs = this.getSongs();
                // Push the current song to the beginning of the recent songs list.
                if (song) {
                    if (this.currentSong) {
                        this.recent.items.splice(0, 0, this.currentSong);
                        // Make sure the songs are distinct; otherwise we can get Angular repeater errors in the UI.
                        this.recent.items = _.uniqBy(this.recent.items, function (i) { return i.id; });
                        if (this.recent.items.length > 3) {
                            this.recent.items.length = 3;
                        }
                        this.recent.cache(); // update the local cache.
                    }
                    this.currentSong = song;
                    this.commentThread = null;
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
                    this.songBatch.playQueuedSong(song);
                }
            };
            NowPlayingController.prototype.playSongFromCurrentArtist = function () {
                if (!!this.currentSong && !!this.currentSong.artistId) {
                    this.audioPlayer.playSongFromArtistId(this.currentSong.artistId);
                }
            };
            NowPlayingController.prototype.playSongFromCurrentAlbum = function () {
                if (!!this.currentSong && !!this.currentSong.albumId) {
                    this.audioPlayer.playSongFromAlbumId(this.currentSong.albumId);
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
                // If we're a modern browser, we 
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrlInput.value);
                }
                else {
                    // Old browsers.
                    shareUrlInput.select();
                    document.execCommand("copy");
                }
            };
            NowPlayingController.prototype.tryNativeShare = function () {
                if (this.currentSong) {
                    this.sharing.nativeShare(this.currentSong);
                }
            };
            NowPlayingController.prototype.toggleCommentThread = function () {
                var _this = this;
                if (this.currentSong) {
                    this.currentSong.areCommentsExpanded = !this.currentSong.areCommentsExpanded;
                    // Start loading the comments if need be.
                    if (!this.isLoadingCommentThread && !this.commentThread) {
                        this.isLoadingCommentThread = true;
                        this.commentThreadApi.get("commentThreads/" + this.currentSong.id)
                            .then(function (results) { return _this.commentThreadLoaded(results); })
                            .finally(function () { return _this.isLoadingCommentThread = false; });
                    }
                }
            };
            NowPlayingController.prototype.addNewComment = function () {
                var _this = this;
                if (this.newCommentText.length > 0 && this.commentThread && this.accountApi.currentUser && this.currentSong) {
                    var comment = {
                        content: this.newCommentText,
                        date: new Date().toISOString(),
                        flagCount: 0,
                        lastFlagDate: null,
                        userDisplayName: this.accountApi.currentUser.displayName,
                        userId: this.accountApi.currentUser.id
                    };
                    this.commentThread.comments.push(comment);
                    this.newCommentText = "";
                    var capturedCommentThread_1 = this.commentThread;
                    this.commentThreadApi.addComment(comment.content, this.commentThread.songId)
                        .then(function (result) {
                        if (_this.commentThread === capturedCommentThread_1) {
                            _this.commentThread = result;
                        }
                    });
                }
            };
            NowPlayingController.prototype.commentThreadLoaded = function (thread) {
                // Is the user still waiting for the comments to this song? Display the comment thread.
                var isWaitingForComments = this.currentSong && this.currentSong.id.localeCompare(thread.songId, undefined, { sensitivity: 'base' }) === 0;
                if (isWaitingForComments) {
                    this.commentThread = thread;
                }
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
                "homeViewModel",
                "appNav",
                "accountApi",
                "commentThreadApi",
                "sharing",
                "songRequestApi",
                "$q"
            ];
            return NowPlayingController;
        }());
        Chavah.NowPlayingController = NowPlayingController;
        Chavah.App.controller("NowPlayingController", NowPlayingController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=NowPlayingController.js.map