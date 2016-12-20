namespace BitShuva.Chavah {
    export class SongListController {
        static $inject = [
            "audioPlayer"
        ];

        constructor(private audioPlayer: AudioPlayerService) {

        }

        playSong(song: Song) {
            // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
            var clone = new Song(song);
            clone.reasonPlayed = SongPick.YouRequestedSong;
            this.audioPlayer.playNewSong(clone);
        }
    }

    App.controller("SongListController", SongListController);
}