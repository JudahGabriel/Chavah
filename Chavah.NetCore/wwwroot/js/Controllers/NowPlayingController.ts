namespace BitShuva.Chavah {
    export class NowPlayingController {
        trending = new List<Song>(() => this.songApi.getTrendingSongs(0, 3).then(results => results.items), "trending", SongApiService.songConverter);
        likes = new List<Song>(() => this.songApi.getRandomLikedSongs(3), "mylikes", SongApiService.songConverter);
        recent = new List<Song>(() => this.getRecentPlays(), "recent", SongApiService.songConverter);
        popular = new List<Song>(() => this.songApi.getPopularSongs(3), "popular", SongApiService.songConverter);
        songs: Song[] = [];
        isFetchingAlbums = false;
        currentSong: Song | null;
        recurringFetchHandle: number | null;
        disposed = new Rx.Subject<boolean>();

        static $inject = [
            "songApi",
            "songBatch",
            "audioPlayer",
            "homeViewModel",
            "appNav",
            "accountApi",
            "sharing",
            "$q"
        ];

        constructor(
            private songApi: SongApiService,
            private songBatch: SongBatchService,
            private audioPlayer: AudioPlayerService,
            private homeViewModel: Server.HomeViewModel,
            private appNav: AppNavService,
            private accountApi: AccountService,
            private sharing: SharingService,
            private $q: ng.IQService) {


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

        get currentSongFacebookShareUrl(): string {
            if (this.currentSong) {
                return this.sharing.facebookShareUrl(this.currentSong);
            }

            return "#";
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

        $onDestroy() {
            if (this.recurringFetchHandle) {
                clearTimeout(this.recurringFetchHandle);
            }

            this.disposed.onNext(true);
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
            if (this.currentSong) {
                this.audioPlayer.playSongFromArtist(this.currentSong.artist);
            }
        }

        playSongFromCurrentAlbum() {
            if (this.currentSong) {
                this.audioPlayer.playSongFromAlbum(this.currentSong.album);
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
            let shareUrlInput = document.querySelector("#currentSongShareLink") as HTMLInputElement;
            var isiOSDevice = navigator.userAgent.match(/ipad|iphone/i);

            // iOS has specific rules about copying text. https://stackoverflow.com/a/43001673/536
            if (isiOSDevice) {

                var editable = shareUrlInput.contentEditable;
                var readOnly = shareUrlInput.readOnly;

                shareUrlInput.contentEditable = "true"; // yes, a string: "true", "false", "inheritable" https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable
                shareUrlInput.readOnly = false;

                var range = document.createRange();
                range.selectNodeContents(shareUrlInput);

                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                shareUrlInput.setSelectionRange(0, 999999);
                shareUrlInput.contentEditable = editable;
                shareUrlInput.readOnly = readOnly;

            } else {
                // Not iOS? Just select the text box containing the URL to share.
                shareUrlInput.select();
            }
            
            document.execCommand("copy");
        }

        tryNativeShare() {
            if (this.currentSong && this.currentSong.isShareExpanded) {
                this.sharing.nativeShareUrl(this.currentSong);
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
