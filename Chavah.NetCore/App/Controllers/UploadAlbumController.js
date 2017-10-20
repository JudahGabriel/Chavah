var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var UploadAlbumController = (function () {
            function UploadAlbumController(artistApi, albumApi, appNav, $scope, $sce) {
                var _this = this;
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.$scope = $scope;
                this.$sce = $sce;
                this.albumName = "";
                this.songs = [];
                this.isUploading = false;
                this.albumArt = null;
                this.purchaseUrl = "";
                this.genre = "";
                this.allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];
                this.artist = null;
                this.allArtists = [];
                this.foreColor = Chavah.Song.defaultSwatch.getBodyTextColor();
                this.backColor = Chavah.Song.defaultSwatch.getHex();
                this.mutedColor = Chavah.Song.defaultSwatch.getHex();
                this.textShadowColor = Chavah.Song.defaultSwatch.getBodyTextColor();
                this.allAlbumSwatches = [];
                artistApi.getAll().then(function (results) { return _this.allArtists = results.items; });
            }
            UploadAlbumController.prototype.chooseSongs = function () {
                var _this = this;
                filepicker.setKey(UploadAlbumController.filePickerKey);
                var options = {
                    extension: ".mp3"
                };
                filepicker.pickMultiple(options, function (results) { return _this.songsChosen(results); }, function (error) { return console.log("Upload failed.", error); });
            };
            UploadAlbumController.prototype.songsChosen = function (songs) {
                var _this = this;
                songs.forEach(function (s) {
                    s["trustedUrl"] = _this.$sce.trustAsResourceUrl(s.url);
                    s["friendlyName"] = UploadAlbumController.songNameFromFileName(s.filename);
                });
                // Order the songs according to file name. If named right, it should order them correctly.
                songs.sort(function (a, b) { return a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0; });
                this.songs = this.songs.concat(songs);
                this.$scope.$applyAsync();
            };
            UploadAlbumController.prototype.chooseAlbumArt = function () {
                var _this = this;
                filepicker.setKey(UploadAlbumController.filePickerKey);
                var options = {
                    extensions: [".jpg", ".png"]
                };
                filepicker.pick(options, function (result) { return _this.albumArtChosen(result); }, function (error) { return console.log("Album art pick failed.", error); });
            };
            UploadAlbumController.prototype.albumArtChosen = function (albumArt) {
                this.albumArt = albumArt;
                this.fetchAlbumColorSwatches(albumArt);
                this.$scope.$applyAsync();
            };
            UploadAlbumController.prototype.fetchAlbumColorSwatches = function (albumArt) {
                var _this = this;
                if (albumArt.url) {
                    var img = document.createElement("img");
                    img.src = "/api/albums/art/imageOnDomain?imageUrl=" + encodeURIComponent(albumArt.url);
                    img.addEventListener("load", function () {
                        var vibrant = new Vibrant(img, 64, 5);
                        var swatches = vibrant.swatches();
                        if (swatches) {
                            _this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);
                            _this.backColor = (swatches.DarkVibrant || swatches.DarkMuted || Chavah.Song.defaultSwatch).getHex();
                            _this.foreColor = (swatches.LightVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getHex();
                            _this.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getBodyTextColor();
                            _this.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Chavah.Song.defaultSwatch).getHex();
                            _this.$scope.$applyAsync();
                        }
                    });
                }
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
            UploadAlbumController.filePickerSongToAlbumSong = function (file) {
                return {
                    fileName: file["friendlyName"],
                    address: file.url
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
                        bodyTextColor: swatch.getBodyTextColor()
                    };
                    return friendlySwatch;
                });
            };
            UploadAlbumController.prototype.hexToRgbString = function (hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (result && result.length >= 4) {
                    return "rgb(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ")";
                }
                return "";
            };
            UploadAlbumController.prototype.artistSelected = function (artist) {
                this.artist = angular.copy(artist);
            };
            UploadAlbumController.prototype.upload = function () {
                var _this = this;
                if (!this.albumArt || !this.albumArt.url) {
                    throw new Error("Must have album art.");
                }
                if (!this.albumName) {
                    throw new Error("Must have album name.");
                }
                if (!this.artist) {
                    throw new Error("Must have an artist");
                }
                if (!this.isUploading) {
                    var album = {
                        albumArtUri: this.albumArt.url,
                        artist: this.artist.name,
                        backColor: this.backColor,
                        foreColor: this.foreColor,
                        genres: this.genre,
                        mutedColor: this.mutedColor,
                        name: this.albumName,
                        purchaseUrl: this.purchaseUrl,
                        songs: this.songs ? this.songs.map(UploadAlbumController.filePickerSongToAlbumSong) : [],
                        textShadowColor: this.textShadowColor
                    };
                    this.isUploading = true;
                    this.albumApi.upload(album)
                        .then(function (albumId) { return _this.appNav.editAlbum(album.artist, album.name); })
                        .finally(function () { return _this.isUploading = false; });
                }
            };
            return UploadAlbumController;
        }());
        UploadAlbumController.filePickerKey = "AwdRIarCGT8COm0mkYX1Ez";
        UploadAlbumController.$inject = [
            "artistApi",
            "albumApi",
            "appNav",
            "$scope",
            "$sce"
        ];
        Chavah.UploadAlbumController = UploadAlbumController;
        Chavah.App.controller("UploadAlbumController", UploadAlbumController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
