namespace BitShuva.Chavah {
    export class NowPlayingController {

        static $inject = [
            "songApi",
            "songBatch",
            "audioPlayer",
            "albumCache",
            "initConfig",
            "appNav",
            "accountApi",
            "$q",
            "sharing"
        ];

        songs: Song[] = [];
        trending: Song[] = [];
        recent: Song[] = [];
        popular: Song[] = [];
        likes: Song[] = [];
        isFetchingAlbums = false;
        currentSong: Song | null;
        recurringFetchHandle: number | null;
        disposed = new Rx.Subject<boolean>();

        constructor(
            private songApi: SongApiService,
            private songBatch: SongBatchService,
            private audioPlayer: AudioPlayerService,
            private albumCache: AlbumCacheService,
            private initConfig: Server.HomeViewModel,
            private appNav: AppNavService,
            private accountApi: AccountService,
            private $q: ng.IQService,
            private sharing: SharingService) {

            this.audioPlayer.song
                .takeUntil(this.disposed)
                .subscribeOnNext(song => this.nextSongBeginning(song));

            this.audioPlayer.songCompleted
                .takeUntil(this.disposed).throttle(5000)
                .subscribe(song => this.songCompleted(song));

            this.songBatch.songsBatch
                .takeUntil(this.disposed)
                .subscribeOnNext(() => this.songs = this.getSongs());

            // Recent plays we fetch once, at init. Afterwards, we update it ourselves.
            this.fetchRecentPlays();
            this.setupRecurringFetches();

            if (initConfig.embed) {
                // If we're embedded on another page, queue up the song we're told to play.
                // Don't play it automatically, though, because there may be multiple embeds on the same page.
                //temp fix??? at least this will display the image for the emebed song
                this.audioPlayer.playNewSong((this.initConfig as any).song as any);
                this.audioPlayer.pause();
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

        get currentSongGooglePlusShareUrl(): string {
            if (this.currentSong) {
                return this.sharing.googlePlusShareUrl(this.currentSong.id);
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
            this.fetchAlbumColors(songs);

            return songs;
        }

        getSongOrPlaceholder(song: Song | null): Song {
            return song || Song.empty();
        }

        fetchAlbumColors(songs: Song[]) {
            let songsNeedingAlbumSwatch = songs
                .filter(s => !s.hasSetAlbumArtColors && s.id !== "songs/0");
            if (songsNeedingAlbumSwatch.length > 0) {
                this.isFetchingAlbums = true;
                this.albumCache.getAlbumsForSongs(songsNeedingAlbumSwatch)
                    .then(albums => this.populateSongsWithAlbumColors(albums));
            }
        }

        populateSongsWithAlbumColors(albums: Album[]) {
            albums.forEach(a => {
                let songsForAlbum = this.getAllSongsOnScreen()
                    .filter(s => s.albumId && s.albumId.toLowerCase() === a.id.toLowerCase());
                songsForAlbum.forEach(s => s.updateAlbumArtColors(a));
            });
        }

        setupRecurringFetches() {
            let songFetchesTask = this.songApi.getTrendingSongs(0, 3)
                .then(results => this.updateSongList(this.trending, results.items))
                .then(() => this.songApi.getPopularSongs(3))
                .then(results => this.updateSongList(this.popular, results))
                .then(() => this.songApi.getLikes(3))
                .then(results => this.updateSongList(this.likes, results))
                .finally(() => {
                    this.fetchAlbumColors(this.getAllSongsOnScreen());

                    // Call ourselves every 30s.
                    this.recurringFetchHandle = setTimeout(() => this.setupRecurringFetches(), 60000);
                });
        }

        fetchRecentPlays() {
            this.songApi.getRecentPlays(3)
                .then(results => {
                    results.forEach(s => this.recent.push(s));
                    if (this.recent.length > 3) {
                        this.recent.length = 3;
                    }
                });
        }

        updateSongList(target: Song[], source: Song[]) {
            target.splice(0, target.length, ...source);
            this.fetchAlbumColors(this.getAllSongsOnScreen());
        }

        getAllSongsOnScreen(): Song[] {
            return this.songs.concat(this.recent, this.trending, this.likes, this.popular);
        }

        nextSongBeginning(song: Song | null) {
            this.songs = this.getSongs();

            if (song) {
                if (this.currentSong) {
                    this.recent.splice(0, 0, this.currentSong);
                    if (this.recent.length > 3) {
                        this.recent.length = 3;
                    }
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
                let songBatch = this.songBatch.songsBatch.getValue();
                let songIndex = songBatch.indexOf(song);
                if (songIndex >= 0) {
                    songBatch.splice(songIndex, 1);
                    songBatch.splice(0, 0, song);
                    this.songBatch.playNext();
                }
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
            let shareUrlInput = document.querySelector("#currentSongShareLink") as HTMLInputElement;
            shareUrlInput.select();
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
