namespace BitShuva.Chavah {
    export class ErrorPlayingAudioController {
        readonly songName: string;
        playDifferentSongText = "Play a different song (10)";
        playDifferentSongCountdown = 10;
        playDifferentSongCountdownHandle = 0;

        static $inject = [
            "song",
            "error",
            "audioPlayer",
            "songBatch",
            "$uibModalInstance",
            "$scope"
        ];

        constructor(
            private readonly song: Song | null,
            private readonly error: IAudioErrorInfo,
            private readonly audioPlayer: AudioPlayerService,
            private readonly songBatch: SongBatchService,
            private readonly $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance,
            private readonly $scope: ng.IScope) {

            this.songName = this.song ? this.song.name : "song";

            this.playDifferentSongCountdownHandle = setInterval(() => this.playDifferentSongCountdownTick(), 1000);
            this.$uibModalInstance.closed.then(() => clearInterval(this.playDifferentSongCountdownHandle));
        }

        playDifferentSong() {
            this.$uibModalInstance.close();
            this.songBatch.playNext();
        }

        playDifferentSongCountdownTick() {
            this.playDifferentSongCountdown--;
            this.playDifferentSongText = `Play a different song (${this.playDifferentSongCountdown})`;
            if (this.playDifferentSongCountdown === 0) {
                clearInterval(this.playDifferentSongCountdownHandle);
                this.playDifferentSong();
            }

            this.$scope.$digest();
        }

        trySongAgain() {
            this.$uibModalInstance.close();

            if (this.song) {
                // Do we have an audio track position? Try to fetch the song, play it again, and seek to that track position.
                const trackPosition = this.error.trackPosition || this.audioPlayer.playedTime.getValue();
                if (trackPosition && trackPosition > 0) {
                    this.audioPlayer.playSongAtTrackPosition(this.song.id, trackPosition);
                } else {
                    this.audioPlayer.playSongById(this.song.id);
                }
            } else {
                this.songBatch.playNext();
            }
        }

        close() {
            this.$uibModalInstance.close();
        }
    }

    App.controller("ErrorPlayingAudioController", ErrorPlayingAudioController);
}
