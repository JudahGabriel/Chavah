var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditAlbumController = /** @class */ (function () {
            function EditAlbumController(albumApi, appNav, $routeParams, $q, homeViewModel) {
                var _this = this;
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.$q = $q;
                this.homeViewModel = homeViewModel;
                this.album = null;
                this.allAlbumSwatches = [];
                this.hasChangedAlbumArt = false;
                // We allow the user to pass in:
                // - An album and artist: /#/admin/album/lamb/sacrifice
                // - An album ID: /#/admin/album/albums/221
                // - Nothing (will create a new album): /#/admin/album/create
                var artist = $routeParams["artist"];
                var album = $routeParams["album"];
                if (artist && album) {
                    var isAlbumId = artist.toLowerCase() === "albums";
                    if (isAlbumId) {
                        this.albumApi.get(artist + "/" + album)
                            .then(function (result) { return _this.albumLoaded(result); });
                    }
                    else {
                        this.albumApi.getByArtistAndAlbumName(artist, album)
                            .then(function (result) { return _this.albumLoaded(result); });
                    }
                }
                else {
                    this.createNewAlbum();
                }
            }
            EditAlbumController.prototype.createNewAlbum = function () {
                return new Chavah.Album({
                    albumArtUri: "",
                    artist: "[new artist]",
                    isVariousArtists: false,
                    backgroundColor: "",
                    foregroundColor: "",
                    mutedColor: "",
                    name: "[new album]",
                    id: "",
                    textShadowColor: "",
                    songCount: 0,
                });
            };
            EditAlbumController.prototype.albumLoaded = function (album) {
                var _this = this;
                if (album) {
                    this.album = album;
                    if (album.albumArtUri) {
                        this.loadCanvasSafeAlbumArt(album.albumArtUri)
                            .then(function (img) { return _this.populateColorSwatches(img); });
                    }
                }
                else {
                    this.appNav.createAlbum();
                }
            };
            EditAlbumController.prototype.save = function () {
                var _this = this;
                if (this.album && !this.album.isSaving) {
                    this.album.isSaving = true;
                    var task = void 0;
                    if (this.hasChangedAlbumArt) {
                        // We must .save first to ensure we have an album ID.
                        this.albumApi.save(this.album)
                            .then(function (result) { return _this.albumApi.changeArt(result.id, _this.album.albumArtUri); })
                            .then(function (result) {
                            _this.album = result;
                            _this.hasChangedAlbumArt = false;
                        })
                            .finally(function () { return _this.album.isSaving = false; });
                    }
                    else {
                        this.albumApi.save(this.album)
                            .then(function (result) { return _this.album = result; })
                            .finally(function () { return _this.album.isSaving = false; });
                    }
                }
                return null;
            };
            EditAlbumController.prototype.hexToRgbString = function (hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (result && result.length >= 4) {
                    return "rgb(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ")";
                }
                return "";
            };
            EditAlbumController.prototype.resetColorSwatches = function (imgUrl) {
                var _this = this;
                this.loadCanvasSafeAlbumArt(imgUrl)
                    .then(function (img) { return _this.populateColorSwatches(img); });
            };
            EditAlbumController.prototype.chooseAlbumArt = function () {
                var _this = this;
                filepicker.setKey(this.homeViewModel.filePickrKey);
                var options = {
                    extensions: [".jpg", ".png"],
                };
                filepicker.pick(options, function (result) { return _this.albumArtChosen(result); }, 
                // tslint:disable-next-line:arrow-parens
                function (error) { return console.log("Album art pick failed.", error); });
            };
            EditAlbumController.prototype.albumArtChosen = function (albumArt) {
                var _this = this;
                this.hasChangedAlbumArt = true;
                if (this.album) {
                    this.album.albumArtUri = albumArt.url;
                }
                this.loadCanvasSafeAlbumArt(albumArt.url)
                    .then(function (img) { return _this.populateColorSwatches(img); });
            };
            EditAlbumController.prototype.populateColorSwatches = function (image) {
                if (this.album) {
                    var vibrant = new Vibrant(image, 64, 5);
                    var swatches = vibrant.swatches();
                    if (swatches) {
                        this.allAlbumSwatches = Chavah.UploadAlbumController.getFriendlySwatches(swatches);
                        if (!this.album.backgroundColor) {
                            // tslint:disable-next-line:max-line-length
                            this.album.backgroundColor = (swatches.DarkVibrant || swatches.DarkMuted || Chavah.Song.defaultSwatch).getHex();
                            // tslint:disable-next-line:max-line-length
                            this.album.foregroundColor = (swatches.LightVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getHex();
                            // tslint:disable-next-line:max-line-length
                            this.album.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getBodyTextColor();
                            // tslint:disable-next-line:max-line-length
                            this.album.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Chavah.Song.defaultSwatch).getHex();
                        }
                    }
                }
            };
            EditAlbumController.prototype.loadCanvasSafeAlbumArt = function (imgUrl) {
                if (!imgUrl) {
                    throw new Error("imgUrl must not be null or undefined");
                }
                var deferred = this.$q.defer();
                var img = document.createElement("img");
                img.src = "/api/albums/imageOnDomain?imageUrl=" + encodeURIComponent(imgUrl);
                img.addEventListener("load", function () {
                    deferred.resolve(img);
                });
                img.addEventListener("error", function () { return deferred.reject(); });
                return deferred.promise;
            };
            EditAlbumController.$inject = [
                "albumApi",
                "appNav",
                "$routeParams",
                "$q",
                "homeViewModel"
            ];
            return EditAlbumController;
        }());
        Chavah.EditAlbumController = EditAlbumController;
        Chavah.App.controller("EditAlbumController", EditAlbumController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=EditAlbumController.js.map