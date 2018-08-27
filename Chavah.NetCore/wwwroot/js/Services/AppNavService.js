var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AppNavService = /** @class */ (function () {
            function AppNavService(templatePaths, $location, $uibModal, initConfig) {
                this.templatePaths = templatePaths;
                this.$location = $location;
                this.$uibModal = $uibModal;
                this.initConfig = initConfig;
                this.promptSignInUrl = "#/promptsignin";
            }
            AppNavService.prototype.signIn = function () {
                this.$location.url("/signin");
            };
            AppNavService.prototype.signOut = function () {
                this.$location.url("/nowplaying");
                window.location.reload();
            };
            AppNavService.prototype.nowPlaying = function () {
                this.$location.url("/nowplaying");
            };
            AppNavService.prototype.promptSignIn = function () {
                this.$location.url(this.promptSignInUrl.replace("#", ""));
            };
            AppNavService.prototype.register = function (attemptedEmail) {
                if (attemptedEmail) {
                    this.$location.url("/register/" + encodeURIComponent(attemptedEmail));
                }
                else {
                    this.$location.url("/register");
                }
            };
            AppNavService.prototype.createPassword = function (email) {
                this.$location.url("/createpassword/" + encodeURIComponent(email));
            };
            AppNavService.prototype.password = function (email) {
                this.$location.url("/password/" + encodeURIComponent(email));
            };
            AppNavService.prototype.editAlbumById = function (albumId) {
                this.$location.url("/admin/album/" + albumId);
            };
            AppNavService.prototype.editAlbum = function (artist, album) {
                var escapedArtist = encodeURIComponent(artist);
                var escapedAlbum = encodeURIComponent(album);
                this.$location.url("/admin/album/" + escapedArtist + "/" + escapedAlbum);
            };
            AppNavService.prototype.getEditSongUrl = function (songId) {
                return "/edit/" + songId;
            };
            AppNavService.prototype.songRequestModal = function () {
                return this.$uibModal.open({
                    controller: "RequestSongController as vm",
                    templateUrl: this.templatePaths.songRequestModal,
                    windowClass: "request-song-modal",
                });
            };
            AppNavService.prototype.cropImageModal = function (imageFile) {
                return this.$uibModal.open({
                    controller: "CropImageController as vm",
                    templateUrl: this.templatePaths.cropImageModal,
                    windowClass: "crop-image-modal",
                    resolve: {
                        imageFile: function () { return imageFile; }
                    }
                });
            };
            AppNavService.prototype.confirmDeleteSong = function (song) {
                return this.$uibModal.open({
                    controller: "ConfirmDeleteSongController as vm",
                    templateUrl: this.templatePaths.confirmDeleteSongModal,
                    windowClass: "confirm-delete-song-modal",
                    resolve: {
                        song: function () { return song; }
                    }
                });
            };
            AppNavService.prototype.createAlbum = function () {
                this.$location.url("/admin/album/create");
            };
            /**
             * Gets the client-side query parameters, returned as an object map.
             */
            AppNavService.prototype.getQueryParams = function () {
                return this.$location.search();
            };
            AppNavService.$inject = [
                "templatePaths",
                "$location",
                "$uibModal",
                "initConfig",
            ];
            return AppNavService;
        }());
        Chavah.AppNavService = AppNavService;
        Chavah.App.service("appNav", AppNavService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AppNavService.js.map