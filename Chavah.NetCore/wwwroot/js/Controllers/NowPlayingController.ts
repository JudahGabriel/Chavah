namespace BitShuva.Chavah {
    export class NowPlayingController {
        trending = new List<Song>(() => this.songApi.getTrendingSongs(0, 3).then(results => results.items), "trending", SongApiService.songConverter);
        likes = new List<Song>(() => this.songApi.getRandomLikedSongs(3), "mylikes", SongApiService.songConverter);
        recent = new List<Song>(() => this.getRecentPlays(), "recent", SongApiService.songConverter);
        popular = new List<Song>(() => this.songApi.getRandomPopular(3), "popular", SongApiService.songConverter);
        newSongs = new List<Song>(() => this.songApi.getRandomNewSongs(3), "newSongs", SongApiService.songConverter);
        recentSongRequests = new List<Song>(() => this.songRequestApi.getRandomRecentlyRequestedSongs(3), "recentRequests", SongApiService.songConverter);
        songs: Song[] = [];
        isFetchingAlbums = false;
        currentSong: Song | null;
        recurringFetchHandle: number | null;
        disposed = new Rx.Subject<boolean>();
        commentThread: Server.CommentThread | null = null;
        isLoadingCommentThread = false;
        newCommentText = "";
        readonly canNativeShare = !!navigator["share"];

        static $inject = [
            "songApi",
            "songBatch",
            "audioPlayer",
            "homeViewModel",
            "appNav",
            "accountApi",
            "commentThreadApi",
            "sharing",
            "songRequestApi",
            "$q"
        ];

        constructor(
            private readonly songApi: SongApiService,
            private readonly songBatch: SongBatchService,
            private readonly audioPlayer: AudioPlayerService,
            private readonly homeViewModel: Server.HomeViewModel,
            private readonly appNav: AppNavService,
            private readonly accountApi: AccountService,
            private readonly commentThreadApi: CommentThreadService,
            private readonly sharing: SharingService,
            private readonly songRequestApi: SongRequestApiService,
            private readonly $q: ng.IQService) {
            
            this.audioPlayer.song
                .takeUntil(this.disposed)
                .subscribeOnNext(song => this.nextSongBeginning(song));

            this.audioPlayer.songCompleted
                .takeUntil(this.disposed).throttle(5000)
                .subscribe(song => this.songCompleted(song));

            this.songBatch.songsBatch
                .takeUntil(this.disposed)
                .subscribeOnNext(() => this.songs = this.getSongs());
            
            if (homeViewModel.embed) {
                // If we're embedded on another page, queue up the song we're told to play.
                // Don't play it automatically, though, because there may be multiple embeds on the same page.
                if (this.homeViewModel.song) {
                    this.audioPlayer.playNewSong(new Song(this.homeViewModel.song));
                    this.audioPlayer.pause();
                }
            } else {
                // Play the next song if we don't already have one playing.
                // We don't have one playing when first loading the UI.
                let hasCurrentSong = this.audioPlayer.song.getValue();
                if (!hasCurrentSong) {
                    if (!this.playSongInUrlQuery()) {
                        this.songBatch.playNext();
                    }
                }
            }
        }

        get currentArtistDonateUrl(): string {
            let song = this.currentSong;
            if (song && song.artist) {
                return "#/donate/" + encodeURIComponent(song.artist);
            }
            return "#/donate";
        }

        get isCurrentSongPaused(): boolean {
            return !!this.currentSong && this.audioPlayer.status.getValue() === AudioStatus.Paused;
        }

        get currentSongShareUrl(): string {
            if (this.currentSong) {
                if (this.currentSong.isShowingEmbedCode) {
                    return this.sharing.getEmbedCode(this.currentSong.id);
                }
                return this.sharing.shareUrl(this.currentSong.id);
            }
            return "";
        }

        get currentSongTwitterShareUrl(): string {
            if (this.currentSong) {
                return this.sharing.twitterShareUrl(this.currentSong);
            }

            return "#";
        }

        get currentSongSmsShareUrl(): string {
            return this.currentSong ? this.sharing.smsShareUrl(this.currentSong) : "#";
        }

        get currentSongWhatsAppShareUrl(): string {
            return this.currentSong ? this.sharing.whatsAppShareUrl(this.currentSong) : "#";
        }

        get currentSongFacebookShareUrl(): string {
            if (this.currentSong) {
                return this.sharing.facebookShareUrl(this.currentSong);
            }

            return "#";
        }

        get commentsTitle(): string {
            if (!this.currentSong || this.currentSong.commentCount === 0) {
                return "Comments";
            }

            if (this.currentSong.commentCount === 1) {
                return "1 comment";
            }

            return `${this.currentSong.commentCount} comments`;
        }

        get currentUserProfileUrl(): string {
            return `/api/cdn/getuserprofile?userId=${this.accountApi.currentUser ? encodeURIComponent(this.accountApi.currentUser.id) : '' }`;            
        }

        getEditSongUrl(): string {
            if (this.currentSong) {
                if (this.accountApi.isSignedIn) {
                    return this.appNav.getEditSongUrl(this.currentSong.id);
                }

                return this.appNav.promptSignInUrl;
            }

            return "#";
        }

        $onInit() {
            if (this.currentSong) {
                this.currentSong.areCommentsExpanded = false;
            }

            // Clear the "go back" URL.
            this.appNav.goBackUrl = null;
        }

        $onDestroy() {
            if (this.recurringFetchHandle) {
                clearTimeout(this.recurringFetchHandle);
            }

            this.disposed.onNext(true);
        }

        pauseOverlayClicked() {
            if (this.currentSong && this.audioPlayer.status.getValue() === AudioStatus.Paused) {
                this.audioPlayer.resume();
            }
        }

        getSongs(): Song[] {
            let songs = [
                this.audioPlayer.song.getValue()!,
                this.songBatch.songsBatch.getValue()[0],
                this.songBatch.songsBatch.getValue()[1],
                this.songBatch.songsBatch.getValue()[2],
                this.songBatch.songsBatch.getValue()[3]
            ].filter(s => !!s && s.name);

            return songs;
        }

        getSongOrPlaceholder(song: Song | null): Song {
            return song || Song.empty();
        }

        getRecentPlays(): ng.IPromise<Song[]> {
            if (this.accountApi.isSignedIn) {
                return this.songApi.getRecentPlays(3);
            }

            // Not signed in? Use whatever we have locally for recent.
            return this.$q.resolve(this.recent.items);
        }

        nextSongBeginning(song: Song | null) {
            this.songs = this.getSongs();

            // Push the current song to the beginning of the recent songs list.
            if (song) {
                if (this.currentSong) {
                    this.recent.items.splice(0, 0, this.currentSong);

                    // Make sure the songs are distinct; otherwise we can get Angular repeater errors in the UI.
                    this.recent.items = _.uniqBy(this.recent.items, i => i.id);
                    if (this.recent.items.length > 3) {
                        this.recent.items.length = 3;
                    }
                    this.recent.cache(); // update the local cache.
                }

                this.currentSong = song;
                this.commentThread = null;
            }
        }

        songCompleted(song: Song | null) {
            if (song) {
                this.songApi.songCompleted(song.id);
            }
        }

        songClicked(song: Song) {
            if (song !== this.currentSong) {
                song.setSolePickReason(SongPick.YouRequestedSong);
                this.songBatch.playQueuedSong(song);
            }
        }

        playSongFromCurrentArtist() {
            if (!!this.currentSong && !!this.currentSong.artistId) {
                this.audioPlayer.playSongFromArtistId(this.currentSong.artistId);
            }
        }

        playSongFromCurrentAlbum() {
            if (!!this.currentSong && !!this.currentSong.albumId) {
                this.audioPlayer.playSongFromAlbumId(this.currentSong.albumId);
            }
        }

        playSongWithTag(tag: string) {
            this.audioPlayer.playSongWithTag(tag);
        }

        playSongInUrlQuery(): boolean {
            // Does the user want us to play a certain song/album/artist?
            let songId = this.getUrlQueryOrNull("song");
            if (songId) {
                this.audioPlayer.playSongById(songId);
                return true;
            }

            let artist = this.getUrlQueryOrNull("artist");
            let album = this.getUrlQueryOrNull("album");

            if (artist && album) {
                this.audioPlayer.playSongFromArtistAndAlbum(artist, album);
                return true;
            }

            if (album) {
                this.audioPlayer.playSongFromAlbum(album);
                return true;
            }

            if (artist) {
                this.audioPlayer.playSongFromArtist(artist);
                return true;
            }

            return false;
        }

        copyShareUrl() {
            // iOS share functionality.
            const shareUrlInput = document.querySelector("#currentSongShareLink") as HTMLInputElement;
            const isiOSDevice = navigator.userAgent.match(/ipad|iphone/i);

            // If we're a modern browser, we 
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrlInput.value);
            } else if (isiOSDevice) {
                // Older versions of iOS have specific rules about copying text. https://stackoverflow.com/a/43001673/536
            
                const editable = shareUrlInput.contentEditable;
                const readOnly = shareUrlInput.readOnly;

                shareUrlInput.contentEditable = "true"; // yes, a string: "true", "false", "inheritable" https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable
                shareUrlInput.readOnly = false;

                const range = document.createRange();
                range.selectNodeContents(shareUrlInput);

                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

                shareUrlInput.setSelectionRange(0, 999999);
                shareUrlInput.contentEditable = editable;
                shareUrlInput.readOnly = readOnly;

            } else {
                // Old browsers.
                shareUrlInput.select();
                document.execCommand("copy");
            }
        }

        tryNativeShare() {
            if (this.currentSong) {
                this.sharing.nativeShare(this.currentSong);
            }
        }

        toggleCommentThread() {
            if (this.currentSong) {
                this.currentSong.areCommentsExpanded = !this.currentSong.areCommentsExpanded;

                // Start loading the comments if need be.
                if (!this.isLoadingCommentThread && !this.commentThread) {
                    this.isLoadingCommentThread = true;
                    this.commentThreadApi.get(`commentThreads/${this.currentSong.id}`)
                        .then(results => this.commentThreadLoaded(results))
                        .finally(() => this.isLoadingCommentThread = false);
                }
            }
        }

        addNewComment() {
            if (this.newCommentText.length > 0 && this.commentThread && this.accountApi.currentUser && this.currentSong) {
                const comment = {
                    content: this.newCommentText,
                    date: new Date().toISOString(),
                    flagCount: 0,
                    lastFlagDate: null,
                    userDisplayName: this.accountApi.currentUser.displayName,
                    userId: this.accountApi.currentUser.id
                };
                this.commentThread.comments.push(comment);
                this.newCommentText = "";
                const capturedCommentThread = this.commentThread;
                this.commentThreadApi.addComment(comment.content, this.commentThread.songId)
                    .then(result => {
                        if (this.commentThread === capturedCommentThread) {
                            this.commentThread = result;
                        }
                    });
            }
        }

        private commentThreadLoaded(thread: Server.CommentThread) {
            // Is the user still waiting for the comments to this song? Display the comment thread.
            const isWaitingForComments = this.currentSong && this.currentSong.id.localeCompare(thread.songId, undefined, { sensitivity: 'base' }) === 0;
            if (isWaitingForComments) {
                this.commentThread = thread;
            }
        }

        private getUrlQueryOrNull(term: string): string | null {
            let queryString = window.location.search;
            if (queryString) {
                let allTerms = queryString.split("&");
                let termWithEquals = term + "=";
                let termAtBeginning = "?" + termWithEquals;
                let match = allTerms.find(t => t.startsWith(termWithEquals) || t.startsWith(termAtBeginning));
                if (match) {
                    let termValue = match.substr(match.indexOf("=") + 1);
                    if (termValue) {
                        let termValueWithoutPlus = termValue.split("+").join(" "); // Replace + with space.
                        return decodeURIComponent(termValueWithoutPlus);
                    }
                }
            }

            return null;
        }
    }

    App.controller("NowPlayingController", NowPlayingController);
}
