var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Controller for a UI component showing a few songs, automatically refreshed every so often. On the home page, we use this component for trending, my likes, recent, and popular.
         * */
        var SongListController = /** @class */ (function () {
            function SongListController(audioPlayer, $q) {
                this.audioPlayer = audioPlayer;
                this.$q = $q;
                this.refreshHandle = null;
            }
            SongListController.prototype.$onInit = function () {
                var _this = this;
                // If we rehydrated some songs from cache, no need to fetch.
                if (this.songs.items.length === 0) {
                    // Delay the first fetch up to 5 seconds so as to give some random song item appearances.
                    setTimeout(function () { return _this.fetchSongs(); }, Math.random() * 5000);
                }
                // Set up the recurring fetch.
                if (!this.refreshInterval) {
                    this.refreshInterval = 60000;
                }
                if (this.refreshInterval !== -1) {
                    this.refreshHandle = setInterval(function () { return _this.fetchSongs(); }, this.refreshInterval + (Math.random() * 3000));
                }
            };
            SongListController.prototype.$onDestroy = function () {
                if (this.refreshHandle) {
                    clearInterval(this.refreshHandle);
                }
            };
            SongListController.prototype.playSong = function (song) {
                // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
                var clone = new Chavah.Song(song);
                clone.setSolePickReason(Chavah.SongPick.YouRequestedSong);
                this.audioPlayer.playNewSong(clone);
            };
            SongListController.prototype.fetchSongs = function () {
                if (this.songs instanceof Chavah.List) {
                    this.songs.fetch();
                }
                else {
                    this.songs.refresh();
                }
            };
            SongListController.$inject = [
                "audioPlayer",
                "$q"
            ];
            return SongListController;
        }());
        Chavah.SongListController = SongListController;
        Chavah.App.component("songList", {
            templateUrl: Chavah.FindAppView("SongList.html"),
            controller: SongListController,
            controllerAs: "vm",
            bindings: {
                songs: Chavah.AngularBindings.OneWay,
                refreshInterval: Chavah.AngularBindings.OneWay
            }
        });
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongListController.js.map