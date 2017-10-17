var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongListController = (function () {
            function SongListController(audioPlayer) {
                this.audioPlayer = audioPlayer;
            }
            SongListController.prototype.playSong = function (song) {
                // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
                var clone = new Chavah.Song(song);
                clone.setSolePickReason(Chavah.SongPick.YouRequestedSong);
                this.audioPlayer.playNewSong(clone);
            };
            return SongListController;
        }());
        SongListController.$inject = [
            "audioPlayer"
        ];
        Chavah.SongListController = SongListController;
        Chavah.App.controller("SongListController", SongListController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
