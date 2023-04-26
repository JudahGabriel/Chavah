namespace BitShuva.Chavah {
    export class ErrorPlayingAudioController {
        readonly songName: string;

        static $inject = [
            "song",
            "error",
            "audioPlayer",
            "songBatch",
            "$uibModalInstance"
        ];

        constructor(
            private readonly song: Song | null,
            private readonly error: IAudioErrorInfo,
            private readonly audioPlayer: AudioPlayerService,
            private readonly songBatch: SongBatchService,
            private readonly $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance) {

            this.songName = this.song ? this.song.name : "song";
        }

        playDifferentSong() {
            this.$uibModalInstance.close();
            this.songBatch.playNext();
        }

        trySongAgain() {
            this.$uibModalInstance.close();

            if (this.song) {
                // Do we have an audio track position? Try to fetch the song, play it again, and seek to that track position.
                if (this.error.trackPosition) {
                    this.audioPlayer.playSongAtTrackPosition(this.song.id, this.error.trackPosition);
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
