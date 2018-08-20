namespace BitShuva.Chavah {
    export class SongRequestApiService {

        static $inject = [
            "httpApi",
            "audioPlayer",
            "songApi",
            "initConfig",
        ];

        private pendingSongRequestIds: string[] = [];
        private hasPlayedRequestAnnouncement = false;

        constructor(
            private httpApi: HttpApiService,
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService,
            private initConfig: Server.IConfigViewModel) {
        }

        hasPendingRequest() {
            let hasPendingRequest = this.pendingSongRequestIds.length > 0;
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

            let args = {
                songId: song.id,
            };
            return this.httpApi.postUriEncoded("/api/songRequests/requestsong", args);
        }

        playRequest() {
            if (!this.hasPendingRequest()) {
                throw new Error("There was no pending song request.");
            }

            if (!this.hasPlayedRequestAnnouncement) {
                this.hasPlayedRequestAnnouncement = true;
                let songRequestNumbers = [1, 3, 4, 5, 6, 7, 8, 9, 10];
                // tslint:disable-next-line:max-line-length
                let songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                let songRequestUrl = `${this.initConfig.soundEffects}/${songRequestName}`;
                this.audioPlayer.playNewUri(songRequestUrl);
            } else {
                this.hasPlayedRequestAnnouncement = false;
                let pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                let currentSong = this.audioPlayer.song.getValue();
                this.songApi.getSongById(pendingRequestedSongId, SongPick.SomeoneRequestedSong)
                    .then(song => {
                        let isStillWaitingForSong = this.audioPlayer.song.getValue() === currentSong;
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
            return this.httpApi.query("/api/songRequests/getPending")
                .then((songIdOrNull: string) => {
                    if (songIdOrNull && this.pendingSongRequestIds.indexOf(songIdOrNull) === -1) {
                        this.pendingSongRequestIds.push(songIdOrNull);
                    }
                });
        }
    }

    App.service("songRequestApi", SongRequestApiService);
}
