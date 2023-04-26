var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Controller for a UI component showing a paged list of songs. Used in the My Likes, Trending, and Popular pages.
         * */
        var SongDeckController = /** @class */ (function () {
            function SongDeckController(audioPlayer, sharing) {
                this.audioPlayer = audioPlayer;
                this.sharing = sharing;
                this.canNativeShare = this.sharing.canNativeShare;
            }
            SongDeckController.prototype.$onInit = function () {
                // If we rehydrated some songs from cache, no need to fetch.
                if (this.songs.items.length === 0) {
                    this.songs.fetchNextChunk();
                    this.sharing.nativeShare;
                }
            };
            SongDeckController.prototype.playSong = function (song) {
                // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
                var clone = new Chavah.Song(song);
                clone.setSolePickReason(Chavah.SongPick.YouRequestedSong);
                this.audioPlayer.playNewSong(clone);
            };
            SongDeckController.$inject = [
                "audioPlayer",
                "sharing"
            ];
            return SongDeckController;
        }());
        Chavah.SongDeckController = SongDeckController;
        Chavah.App.component("songDeck", {
            templateUrl: Chavah.FindAppView("SongDeck.html"),
            controller: SongDeckController,
            controllerAs: "vm",
            bindings: {
                songs: Chavah.AngularBindings.OneWay,
                showLoadMore: Chavah.AngularBindings.OneWay
            }
        });
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SongDeckController.js.map