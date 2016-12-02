namespace BitShuva.Chavah {
    export class SongListController {
        static $inject = [
            "audioPlayer"
        ];

        constructor(private audioPlayer: AudioPlayerService) {

        }

        playSong(song: Song) {
            song.reasonPlayed = SongPick.YouRequestedSong;
            this.audioPlayer.playNewSong(song);
        }
    }

    App.controller("SongListController", SongListController);
}