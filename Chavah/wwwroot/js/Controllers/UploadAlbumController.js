var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var UploadAlbumController = /** @class */ (function () {
            function UploadAlbumController(albumApi, appNav, $scope, $q) {
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.$scope = $scope;
                this.$q = $q;
                this.albumName = "";
                this.artistName = "";
                this.albumHebrewName = null;
                this.songs = [];
                this.isSaving = false;
                this.albumArt = null;
                this.purchaseUrl = "";
                this.genre = "";
                this.uploadError = null;
                this.allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];
                this.foreColor = Chavah.Song.defaultSwatch.getBodyTextColor();
                this.backColor = Chavah.Song.defaultSwatch.getHex();
                this.mutedColor = Chavah.Song.defaultSwatch.getHex();
                this.textShadowColor = Chavah.Song.defaultSwatch.getBodyTextColor();
                this.allAlbumSwatches = [];
            }
            Object.defineProperty(UploadAlbumController.prototype, "isUploadingMediaFiles", {
                get: function () {
                    return this.songs.some(function (a) { return a.status === "uploading"; });
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(UploadAlbumController.prototype, "anySongsFailedToUpload", {
                get: function () {
                    return this.songs.some(function (a) { return a.status === "failed"; });
                },
                enumerable: false,
                configurable: true
            });
            UploadAlbumController.prototype.chooseSongs = function () {
                $("#chooseMp3sInput").click();
            };
            UploadAlbumController.prototype.chooseAlbumArt = function () {
                $("#chooseAlbumArtInput").click();
            };
            UploadAlbumController.prototype.songsChosen = function (e) {
                return __awaiter(this, void 0, void 0, function () {
                    var fileInput;
                    return __generator(this, function (_a) {
                        fileInput = e.target;
                        if (fileInput && fileInput.files && fileInput.files.length > 0) {
                            this.addFilesToUploadQueue(Array.from(fileInput.files));
                            this.$scope.$applyAsync();
                        }
                        return [2 /*return*/];
                    });
                });
            };
            UploadAlbumController.prototype.albumArtChosen = function (e) {
                return __awaiter(this, void 0, void 0, function () {
                    var fileInput, file, fileUpload_1;
                    var _this = this;
                    return __generator(this, function (_a) {
                        fileInput = e.target;
                        if (fileInput && fileInput.files && fileInput.files.length === 1) {
                            file = fileInput.files[0];
                            fileUpload_1 = this.createMediaFileUpload(file);
                            fileUpload_1.status = "uploading";
                            this.albumArt = fileUpload_1;
                            this.albumApi.uploadTempFile(file)
                                .then(function (tempFile) { return _this.albumArtUploadSucceeded(fileUpload_1, tempFile); })
                                .catch(function (error) { return _this.albumArtUploadFailed(fileUpload_1, error); });
                        }
                        this.$scope.$applyAsync();
                        return [2 /*return*/];
                    });
                });
            };
            UploadAlbumController.prototype.albumArtUploadSucceeded = function (albumArt, tempFile) {
                this.markUploadAsCompleted(albumArt, tempFile);
                this.reloadAlbumColorSwatches(tempFile.url);
            };
            UploadAlbumController.prototype.albumArtUploadFailed = function (albumArt, error) {
                this.markUploadAsFailed(albumArt, error);
            };
            UploadAlbumController.prototype.addFilesToUploadQueue = function (files) {
                var _a;
                var _this = this;
                var fileUploads = files
                    .sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; })
                    .map(function (file) { return _this.createMediaFileUpload(file); });
                (_a = this.songs).push.apply(_a, fileUploads);
                this.processFileUploads();
            };
            UploadAlbumController.prototype.createMediaFileUpload = function (file) {
                return {
                    file: file,
                    name: UploadAlbumController.songNameFromFileName(file.name),
                    error: null,
                    url: null,
                    status: "queued",
                    id: null
                };
            };
            UploadAlbumController.prototype.processFileUploads = function () {
                var _this = this;
                var nextQueuedSong = this.songs.find(function (s) { return s.status === "queued"; });
                if (nextQueuedSong) {
                    nextQueuedSong.status = "uploading";
                    this.albumApi.uploadTempFile(nextQueuedSong.file)
                        .then(function (tempFile) { return _this.songUploadSucceeded(nextQueuedSong, tempFile); })
                        .catch(function (error) { return _this.songUploadFailed(nextQueuedSong, error); })
                        .finally(function () { return _this.processFileUploads(); });
                }
            };
            UploadAlbumController.prototype.songUploadSucceeded = function (upload, tempFile) {
                this.markUploadAsCompleted(upload, tempFile);
            };
            UploadAlbumController.prototype.songUploadFailed = function (upload, error) {
                this.markUploadAsFailed(upload, error);
            };
            UploadAlbumController.prototype.markUploadAsCompleted = function (upload, tempFile) {
                upload.status = "completed";
                upload.url = tempFile.url;
                upload.id = tempFile.id;
                upload.error = null;
            };
            UploadAlbumController.prototype.markUploadAsFailed = function (upload, error) {
                upload.status = "failed";
                upload.url = null;
                upload.error = JSON.stringify(error || "failed to upload file");
            };
            UploadAlbumController.prototype.reloadAlbumColorSwatches = function (albumArtUri) {
                return __awaiter(this, void 0, void 0, function () {
                    var swatches;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.fetchAlbumColorSwatches(albumArtUri)];
                            case 1:
                                swatches = _a.sent();
                                if (swatches) {
                                    this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);
                                    this.backColor = (swatches.DarkVibrant || swatches.DarkMuted || Chavah.Song.defaultSwatch).getHex();
                                    this.foreColor = (swatches.LightVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getHex();
                                    this.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getBodyTextColor();
                                    this.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Chavah.Song.defaultSwatch).getHex();
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
            UploadAlbumController.prototype.fetchAlbumColorSwatches = function (imageUrl) {
                var img = document.createElement("img");
                var deferred = this.$q.defer();
                img.crossOrigin = "Anonymous";
                //img.src = imageUrl;
                img.src = "/api/albums/imageOnDomain?imageUrl=" + encodeURIComponent(imageUrl);
                img.addEventListener("load", function () {
                    var vibrant = new Vibrant(img, 64, 5);
                    var swatches = vibrant.swatches();
                    deferred.resolve(swatches);
                }, { once: true });
                img.addEventListener("error", function (error) { return deferred.reject(error); }, { once: true });
                return deferred.promise;
            };
            UploadAlbumController.prototype.moveSongUp = function (song) {
                var currentIndex = this.songs.indexOf(song);
                if (currentIndex > 0) {
                    var newIndex = currentIndex - 1;
                    this.songs.splice(currentIndex, 1);
                    this.songs.splice(newIndex, 0, song);
                }
            };
            UploadAlbumController.prototype.moveSongDown = function (song) {
                var currentIndex = this.songs.indexOf(song);
                if (currentIndex < (this.songs.length - 1)) {
                    var newIndex = currentIndex + 1;
                    this.songs.splice(currentIndex, 1);
                    this.songs.splice(newIndex, 0, song);
                }
            };
            UploadAlbumController.prototype.removeSong = function (song) {
                var index = this.songs.indexOf(song);
                if (index >= 0) {
                    this.songs.splice(index, 1);
                }
            };
            UploadAlbumController.prototype.hexToRgbString = function (hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (result && result.length >= 4) {
                    return "rgb(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ")";
                }
                return "";
            };
            UploadAlbumController.prototype.upload = function () {
                var _this = this;
                this.uploadError = null;
                if (!this.albumArt || !this.albumArt.url) {
                    this.uploadError = "Must have album art.";
                    return;
                }
                if (!this.albumName) {
                    this.uploadError = "Must have album name.";
                    return;
                }
                if (!this.artistName) {
                    this.uploadError = "Must have an artist";
                    return;
                }
                if (this.isUploadingMediaFiles) {
                    this.uploadError = "Song upload is still progress";
                    return;
                }
                if (this.songs.some(function (s) { return !s.url || !s.id; })) {
                    this.uploadError = "Some songs haven't finished uploading";
                    return;
                }
                if (!this.isSaving) {
                    var album_1 = {
                        albumArt: UploadAlbumController.mediaUploadToTempFile(this.albumArt),
                        artist: this.artistName,
                        backColor: this.backColor,
                        foreColor: this.foreColor,
                        genres: this.genre,
                        mutedColor: this.mutedColor,
                        name: this.albumName,
                        hebrewName: this.albumHebrewName,
                        purchaseUrl: this.purchaseUrl,
                        songs: this.songs ? this.songs.map(UploadAlbumController.mediaUploadToTempFile) : [],
                        textShadowColor: this.textShadowColor,
                    };
                    this.isSaving = true;
                    this.albumApi.upload(album_1)
                        .then(function (albumId) { return _this.appNav.editAlbum(album_1.artist, album_1.name); })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            UploadAlbumController.songNameFromFileName = function (fileName) {
                var songName = fileName;
                // Slice off the extension.
                var lastIndexOfDot = songName.lastIndexOf(".");
                if (lastIndexOfDot > 0) {
                    songName = songName.substring(0, lastIndexOfDot);
                }
                // Slice off anything before " - "
                var lastIndexOfDash = songName.lastIndexOf(" - ");
                if (lastIndexOfDash >= 0) {
                    songName = songName.substr(lastIndexOfDash + 3);
                }
                return songName;
            };
            UploadAlbumController.mediaUploadToTempFile = function (file) {
                if (!file.id) {
                    throw new Error("Media file " + file.name + " hasn't been uploaded");
                }
                return {
                    name: file.name,
                    url: file.url,
                    id: file.id
                };
            };
            UploadAlbumController.getFriendlySwatches = function (rawSwatches) {
                return Object.getOwnPropertyNames(rawSwatches)
                    .filter(function (p) { return !!rawSwatches[p]; })
                    .map(function (p) {
                    var swatch = rawSwatches[p];
                    var friendlySwatch = {
                        name: p,
                        color: swatch.getHex(),
                        titleTextColor: swatch.getTitleTextColor(),
                        bodyTextColor: swatch.getBodyTextColor(),
                    };
                    return friendlySwatch;
                });
            };
            UploadAlbumController.$inject = [
                "albumApi",
                "appNav",
                "$scope",
                "$q"
            ];
            return UploadAlbumController;
        }());
        Chavah.UploadAlbumController = UploadAlbumController;
        Chavah.App.controller("UploadAlbumController", UploadAlbumController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=UploadAlbumController.js.map