var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ErrorPlayingAudioController = /** @class */ (function () {
            function ErrorPlayingAudioController(song, error, audioPlayer, songBatch, $uibModalInstance) {
                this.song = song;
                this.error = error;
                this.audioPlayer = audioPlayer;
                this.songBatch = songBatch;
                this.$uibModalInstance = $uibModalInstance;
                this.songName = this.song ? this.song.name : "song";
            }
            ErrorPlayingAudioController.prototype.playDifferentSong = function () {
                this.$uibModalInstance.close();
                this.songBatch.playNext();
            };
            ErrorPlayingAudioController.prototype.trySongAgain = function () {
                this.$uibModalInstance.close();
                if (this.song) {
                    // Do we have an audio track position? Try to fetch the song, play it again, and seek to that track position.
                    if (this.error.trackPosition) {
                        this.audioPlayer.playSongAtTrackPosition(this.song.id, this.error.trackPosition);
                    }
                    else {
                        this.audioPlayer.playSongById(this.song.id);
                    }
                }
                else {
                    this.songBatch.playNext();
                }
            };
            ErrorPlayingAudioController.prototype.close = function () {
                this.$uibModalInstance.close();
            };
            ErrorPlayingAudioController.$inject = [
                "song",
                "error",
                "audioPlayer",
                "songBatch",
                "$uibModalInstance"
            ];
            return ErrorPlayingAudioController;
        }());
        Chavah.ErrorPlayingAudioController = ErrorPlayingAudioController;
        Chavah.App.controller("ErrorPlayingAudioController", ErrorPlayingAudioController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ErrorPlayingAudioController.js.map