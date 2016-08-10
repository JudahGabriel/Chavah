namespace BitShuva.Chavah {
    export class NowPlayingController {

        static $inject = [
            "songBatch",
            "audioPlayer",
            "$q"
        ];

        songs: Song[] = [];

        constructor(
            private songBatch: SongBatchService,
            private audioPlayer: AudioPlayerService,
            private $q: ng.IQService) {

            this.audioPlayer.song.subscribeOnNext(() => this.songs = this.getSongs());
            this.songBatch.songsBatch.subscribeOnNext(() => this.songs = this.getSongs());
        }
        
        private getSongs() {
            // This should return an array that is displayed in the UI like so:
            // [0] - Next song, 3rd in line.
            // [1] - Next song, 2nd in line.
            // [2] - Next song, 1st in line.
            // [3] - Currently playing song.
            // [4] - Last played song, 1st in line.
            // [5] - Last played song, 2nd in line.
            // [6] - Last played song, 3rd in line.
            return [
                this.getSongOrPlaceholder(this.songBatch.songsBatch.getValue()[2]), // next song, 3rd in line
                this.getSongOrPlaceholder(this.songBatch.songsBatch.getValue()[1]), // next song, 2nd in line
                this.getSongOrPlaceholder(this.songBatch.songsBatch.getValue()[0]), // next song, 1st in line
                this.getSongOrPlaceholder(this.audioPlayer.song.getValue()), // the currently playing song
                this.getSongOrPlaceholder(this.audioPlayer.playedSongs[0]), // the last played song
                this.getSongOrPlaceholder(this.audioPlayer.playedSongs[1]), // the 2nd to last played song
                this.getSongOrPlaceholder(this.audioPlayer.playedSongs[2]) // the 3rd to last played song
            ] 
        }

        getSongOrPlaceholder(songOrNull: Song): Song {
            if (songOrNull) {
                songOrNull.calculateAlbumColors(this.$q);
            }

            return songOrNull || Song.empty();
        }
    }

    App.controller("NowPlayingController", NowPlayingController);
}