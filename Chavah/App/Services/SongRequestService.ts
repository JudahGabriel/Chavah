namespace BitShuva.Chavah {
    export class SongRequestApiService {

        private pendingSongRequestIds: string[] = [];
        private hasPlayedRequestAnnouncement = false;

        static $inject = [
            "httpApi",
            "audioPlayer",
            "songApi"
        ];

        constructor(
            private httpApi: HttpApiService,
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService) { 
        }

        hasPendingRequest() {
            var hasPendingRequest = this.pendingSongRequestIds.length > 0;
            if (this.pendingSongRequestIds.length === 0) {
                setTimeout(() => this.fetchPendingSongRequests(), 2000);
            }

            return hasPendingRequest;
        }

        isSongPendingRequest(songId: string): boolean {
            return this.pendingSongRequestIds.indexOf(songId) !== -1;
        }

        requestSong(song: Song): ng.IPromise<any> {            
            this.pendingSongRequestIds.unshift(song.id);
            this.hasPlayedRequestAnnouncement = false;
            
            var url = `/api/requests/requestsong?songId=${song.id}`;
            return this.httpApi.post(url, null);
        }

        playRequest() {
            if (!this.hasPendingRequest()) {
                throw "There was no pending song request.";
            }

            if (!this.hasPlayedRequestAnnouncement) {
                this.hasPlayedRequestAnnouncement = true;
                var songRequestNumbers = [1, 3, 4, 5, 6, 7, 8, 9, 10];
                var songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                var songRequestUrl = "content/soundEffects/" + songRequestName;
                this.audioPlayer.playNewUri(songRequestUrl);
            }
            else {
                this.hasPlayedRequestAnnouncement = false;
                var pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                var currentSong = this.audioPlayer.song.getValue();
                this.songApi.getSongById(pendingRequestedSongId, SongPick.SomeoneRequestedSong)
                    .then(song => {
                        var isStillWaitingForSong = this.audioPlayer.song.getValue() === currentSong;   
                        if (isStillWaitingForSong && song) {
                            this.audioPlayer.playNewSong(song);
                        }
                    });
            }
        }

        removePendingSongRequest(songId: string) {
            this.pendingSongRequestIds = this.pendingSongRequestIds.filter(id => id !== songId);
        }

        private fetchPendingSongRequests() {
            return this.httpApi.query("/api/requests/pending")
                .then((songIdOrNull: string) => {
                    if (songIdOrNull && this.pendingSongRequestIds.indexOf(songIdOrNull) === -1) {
                        this.pendingSongRequestIds.push(songIdOrNull);
                    }
                });
        }
    }

    App.service("songRequestApi", SongRequestApiService);
}