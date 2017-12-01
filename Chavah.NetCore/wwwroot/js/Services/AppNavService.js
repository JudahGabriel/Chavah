var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AppNavService = (function () {
            function AppNavService(audioPlayer, templatePaths, $location, $uibModal) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.templatePaths = templatePaths;
                this.$location = $location;
                this.$uibModal = $uibModal;
                this.promptSignInUrl = "#/promptsignin";
                // Listen for when the song changes and update the document title.
                audioPlayer.song
                    .subscribe(function (song) { return _this.updateDocumentTitle(song); });
            }
            AppNavService.prototype.signIn = function () {
                this.$location.url("/signin");
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
            AppNavService.prototype.showSongRequestDialog = function () {
                var requestSongDialog = this.$uibModal.open({
                    controller: "RequestSongController as vm",
                    templateUrl: this.templatePaths.songRequestModal,
                    windowClass: "request-song-modal",
                });
                return requestSongDialog;
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
            AppNavService.prototype.updateDocumentTitle = function (song) {
                // Update the document title so that the browser tab updates.
                if (song) {
                    document.title = song.name + " by " + song.artist + " on Chavah Messianic Radio";
                }
                else {
                    document.title = "Chavah Messianic Radio";
                }
            };
            return AppNavService;
        }());
        AppNavService.$inject = [
            "audioPlayer",
            "templatePaths",
            "$location",
            "$uibModal",
        ];
        Chavah.AppNavService = AppNavService;
        Chavah.App.service("appNav", AppNavService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AppNavService.js.map