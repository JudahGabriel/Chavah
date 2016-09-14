namespace BitShuva.Chavah {
    export class SongRequestApiService {

        private pendingSongRequestIds: string[] = [];
        private hasPlayedRequestAnnouncement = false;

        static $inject = [
            "httpApi",
            "audioPlayer",
            "songApi",
            "$uibModal"
        ];

        constructor(
            private httpApi: HttpApiService,
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService,
            private $uibModal: ng.ui.bootstrap.IModalService) { 
        }

        showSongRequestDialog(): ng.ui.bootstrap.IModalServiceInstance {
            var requestSongDialog = this.$uibModal.open({
                controller: "RequestController as vm",
                templateUrl: "../Views/RequestSong.html"
            });

            return requestSongDialog;
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

            var args = {
                songId: song.id
            };
            var url = "/api/requests/request/";
            return this.httpApi.post(url, args);
        }

        playRequest() {
            if (!this.hasPendingRequest()) {
                throw "There was no pending song request.";
            }

            if (!this.hasPlayedRequestAnnouncement) {
                this.hasPlayedRequestAnnouncement = true;
                var songRequestNumbers = [0, 1, 3, 4, 5, 6, 7];
                var songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                var songRequestUrl = "content/soundEffects/" + songRequestName;
                this.audioPlayer.playNewUri(songRequestUrl);
            }
            else {
                this.hasPlayedRequestAnnouncement = false;
                var pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                var currentSong = this.audioPlayer.song.getValue();
                this.songApi.getSongById(pendingRequestedSongId)
                    .then(song => {
                        var isStillWaitingForSong = this.audioPlayer.song.getValue() === currentSong;
                        if (isStillWaitingForSong) {
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