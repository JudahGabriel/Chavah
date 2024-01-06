namespace BitShuva.Chavah {
    export class SongRequestApiService {
        
        private pendingSongRequestIds: string[] = [];
        private hasPlayedRequestAnnouncement = false;
        private anonUserPlayedSongIds: string[] | null = null;
        private lastFetchRequestsTime: number | null = null;

        private static readonly anonUserPlayedSongIdsKey = "songrequests-anonUserPlayedSongIds";
        static $inject = [
            "httpApi",
            "audioPlayer",
            "songApi",
            "homeViewModel",
            "accountApi"
        ];

        constructor(
            private httpApi: HttpApiService,
            private audioPlayer: AudioPlayerService,
            private songApi: SongApiService,
            private homeViewModel: Server.HomeViewModel,
            private accountApi: AccountService) {

            // When the user signs in, we need to let the server know that we 
            // may have heard some song requests while signed out.
            this.accountApi.signedInState
                .distinctUntilChanged()
                .where(i => i === true)
                .subscribe(() => this.userSignedIn());

            // Deprecated: the album art cache is no more. Remove it from the local store.
            // Remove this code after 6/1/2019
            localStorage.removeItem("album-art-cache");
        }

        hasPendingRequest() {
            let hasPendingRequest = this.pendingSongRequestIds.length > 0;
            if (this.pendingSongRequestIds.length === 0) {
                setTimeout(() => this.fetchPendingSongRequests(), 5000);
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
                const songRequestNumbers = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
                // tslint:disable-next-line:max-line-length
                const songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                const songRequestUrl = `${this.homeViewModel.soundEffects}/${songRequestName}`;
                this.audioPlayer.playNewUri(songRequestUrl);
            } else {
                // We've already played the song req announcement - yay!
                // Now we actually played the requested song.
                this.hasPlayedRequestAnnouncement = false;
                const pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                const currentSong = this.audioPlayer.song.getValue();
                this.songApi.getSongById(pendingRequestedSongId, SongPick.SomeoneRequestedSong)
                    .then(song => {
                        const isStillWaitingForSong = this.audioPlayer.song.getValue() === currentSong;
                        if (isStillWaitingForSong && song) {
                            this.audioPlayer.playNewSong(song);
                            this.addAnonUserPlayedSong(song.id);
                        }
                    });
            }
        }

        getRandomRecentlyRequestedSongs(count: number): ng.IPromise<Song[]> {
            const args = {
                count
            };
            return this.httpApi.query("/api/songRequests/getRandomRecentlyRequestedSongs", args, SongApiService.songListConverter);
        }

        //removePendingSongRequest(songId: string) {
        //    this.pendingSongRequestIds = this.pendingSongRequestIds.filter(id => id !== songId);
        //}

        private fetchPendingSongRequests() {
            // If we checked in the last 30 seconds, don't check again.
            const sixtySecondsInMS = 30000;
            const now = Date.now();
            const shouldAskServer = this.lastFetchRequestsTime === null || now - this.lastFetchRequestsTime > sixtySecondsInMS;

            if (shouldAskServer) {
                this.lastFetchRequestsTime = now;

                // Are we signed in? Get a pending song request for our user.
                if (this.accountApi.isSignedIn) {
                    this.fetchRequestForCurrentUser();
                } else {
                    // Not signed in? Find recent song requests that we haven't listened to.
                    this.fetchRequestForAnonymous();
                }
            }
        }

        private async fetchRequestForCurrentUser() {
            const songId = await this.httpApi.query<string | null>("/api/songRequests/getPending");    
            if (songId && this.pendingSongRequestIds.indexOf(songId) === -1) {
                this.pendingSongRequestIds.push(songId);
            }
        }

        private async fetchRequestForAnonymous() {
            // First, grab any pending song requests from the server.
            const recentRequestSongIds = await this.httpApi.query<string[]>("/api/songRequests/getRecentRequestedSongIds");

            // Skip any that we've already played.
            const playedSongIds = this.getAnonUserPlayedSongIds();
            const unplayedSongIds = _.without(recentRequestSongIds, ...playedSongIds);
            const unplayedNotYetPending = _.without(unplayedSongIds, ...this.pendingSongRequestIds);
            
            // Grab the last one and add it to our pending list.
            const lastUnplayedNotYetPending = _.last(unplayedNotYetPending);
            if (lastUnplayedNotYetPending) {
                this.pendingSongRequestIds.push(lastUnplayedNotYetPending);
            }
        }

        private getAnonUserPlayedSongIds(): string[] {
            if (!this.anonUserPlayedSongIds) {
                // Rehydrate them from local storage. 
                // We need to store them in local storage, otherwise the user 
                // may hear duplicate song requests if he closes Chavah and 
                // quickly reopens it.
                try {
                    const json = localStorage.getItem(SongRequestApiService.anonUserPlayedSongIdsKey);
                    if (json) {
                        this.anonUserPlayedSongIds = JSON.parse(json);
                    }
                } catch (error) {
                    console.log("failed to rehydrate anonymous user's played song IDs", error);
                    this.anonUserPlayedSongIds = [];
                }
            }

            if (!this.anonUserPlayedSongIds) {
                this.anonUserPlayedSongIds = [];
            }

            return this.anonUserPlayedSongIds;
        }

        private addAnonUserPlayedSong(songId: string) {
            // If we're anonymous, update the list of played song IDs.
            if (!this.accountApi.isSignedIn) {
                const playedSongIds = this.getAnonUserPlayedSongIds();
                playedSongIds.unshift(songId);
                this.updateAnonymousUserPlayedSongIds(this.getAnonUserPlayedSongIds());
            }
        }

        private updateAnonymousUserPlayedSongIds(songIds: string[]) {
            if (!songIds) {
                songIds = [];
            }
            const maxPlayedSongs = 10;
            if (songIds.length > maxPlayedSongs) {
                songIds.length = 10;
            }

            try {
                localStorage.setItem(SongRequestApiService.anonUserPlayedSongIdsKey, JSON.stringify(songIds));
            } catch (error) {
                console.log("Unable to store anonymous user song IDs", error);
            }

            this.anonUserPlayedSongIds = songIds;
        }

        private userSignedIn() {
            const songsPlayedWhileAnonymous = this.getAnonUserPlayedSongIds();
            if (songsPlayedWhileAnonymous && songsPlayedWhileAnonymous.length) {
                this.httpApi.post("/api/songRequests/markAsPlayed", songsPlayedWhileAnonymous);
            }
        }
    }

    App.service("songRequestApi", SongRequestApiService);
}
