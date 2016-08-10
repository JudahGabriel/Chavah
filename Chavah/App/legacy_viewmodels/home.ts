import Router = require("plugins/router");
import App = require("durandal/app");
import SongRequestManager = require("services/songRequestManager");
import SongPlayer = require("services/songPlayer");
import Song = require("models/song");
import AudioStatus = require("common/audioStatus");
import GetSongCommand = require("commands/getSongCommand");
import SongPlaceHolder = require("services/songPlaceHolder");
import GetTrendingSongsCommand = require("commands/getTrendingSongsCommand");
import GetTopSongsCommand = require("commands/getTopSongsCommand");
import GetRandomLikedSongsCommand = require("commands/getRandomLikedSongsCommand");
import ArtistImageRotater = require("services/artistImageRotater");
import StationIdentifier = require("services/stationIdentifier");
import GetLoggedInUserNameCommand = require("commands/getLoggedInUserNameCommand");
import SignInCommand = require("commands/signInCommand");
import SignOutCommand = require("commands/signOutCommand");
import PingCommand = require("commands/pingCommand");

class Home {
    player = new SongPlayer();
    songRequestManager = new SongRequestManager();    
    isPaused: KnockoutComputed<boolean>;
    twitterShareLink: KnockoutComputed<string>;
    currentArtistBio = ko.observable<string>();
    recentSongs = ko.observableArray([new SongPlaceHolder(), new SongPlaceHolder(), new SongPlaceHolder()]);
    likedSongs = ko.observableArray([new SongPlaceHolder(), new SongPlaceHolder(), new SongPlaceHolder()]);
    trendingSongs = ko.observableArray([new SongPlaceHolder(), new SongPlaceHolder(), new SongPlaceHolder()]);
    topSongs = ko.observableArray([new SongPlaceHolder(), new SongPlaceHolder(), new SongPlaceHolder()]);
    hasAnyRecentSongs: KnockoutComputed<boolean>;
    hasLikedAnySongs: KnockoutComputed<boolean>;DurandalViewEngineModule
    hasAnyTrendingSongs: KnockoutComputed<boolean>;
    hasAnyTopSongs: KnockoutComputed<boolean>;
    facebookShareLink: KnockoutComputed<string>;
    googlePlusShareLink: KnockoutComputed<string>;
    artistImageRotater = new ArtistImageRotater(this.player.song);
    stationIdentifier = new StationIdentifier();
    purchaseSongUrl = ko.computed(() => this.player.song() ? this.player.song().purchaseUri : '#');
    signedInUserName = ko.observable<string>().subscribeTo("SignedInUserChanged");
    mobileSongBatch: Song[] = [];

    constructor() {
        this.isPaused = ko.computed(() => this.player.status() === AudioStatus.Paused);
        this.player.status.subscribe(s => this.songStatusChanged(s));
        this.player.song.subscribe(s => this.currentSongChanged(s));
        this.twitterShareLink = ko.computed(() => {
            var songToShare = this.player.song();
            if (songToShare) {
                var tweetText = 'Listening to "' + songToShare.artist + " - " + songToShare.name + '"';
                var url = "http://messianicradio.com/?song=" + songToShare.id;
                var via = "messianicradio";
                return "https://twitter.com/share?text=" + encodeURIComponent(tweetText) + "&url=" + encodeURIComponent(url) + "&via=" + encodeURIComponent(via);
            }
            return "#";
        });
        this.facebookShareLink = ko.computed(() => {
            var songToShare = this.player.song();
            if (songToShare) {
                var name = (songToShare.artist + " - " + songToShare.name).replace("&", "and"); // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
                var url = "http://messianicradio.com?song=" + songToShare.id;
	            return "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                        "&link=" + url +
                        "&picture=" + encodeURIComponent("http://messianicradio.com/api/albums/art/get?artist=" + songToShare.artist + "&album=" + songToShare.album) +
                        "&name=" + encodeURIComponent(name) +
                        "&caption=" + encodeURIComponent("On " + songToShare.album) +
                        "&description=" + encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music") +
                        "&redirect_uri=" + encodeURIComponent("http://messianicradio.com/#thanksforsharing")
	        }
            return "#";
        });
        this.googlePlusShareLink = ko.computed(() => {
            var songToShare = this.player.song();
            if (songToShare) {
                return "https://plus.google.com/share?url=" + encodeURI("http://messianicradio.com/?song=" + songToShare.id);
            }
            return "#";
        });
        this.hasAnyRecentSongs = ko.computed(() => this.recentSongs().some(r => r.hasSong()));
        this.hasLikedAnySongs = ko.computed(() => this.likedSongs().some(r => r.hasSong()));
        this.hasAnyTrendingSongs = ko.computed(() => this.trendingSongs().some(r => r.hasSong()));
        this.hasAnyTopSongs = ko.computed(() => this.topSongs().some(r => r.hasSong()));

        var existingSignedInUser = window["chavah.signedInUserName"];
        if (existingSignedInUser) {
            this.signedInUserName(existingSignedInUser);
        }
    }

    attached() {
        var audioElement = <HTMLAudioElement>document.querySelector("audio");
        this.player.initialize(audioElement);

        this.setupRecurringFetches();
        this.pickInitialSongToPlay();
        this.fetchSongBatchIfNecessary();
        this.loadLoginInfo();
    }

    pickInitialSongToPlay() {
        // See if we were passed a song, artist, or album to play.
        var songToPlay = Home.parseSongToPlayQueryString();
        var artistToPlay = Home.parseQueryStringData("artist");
        var albumToPlay = Home.parseQueryStringData("album");
        if (songToPlay) {
            this.player.playSongById(decodeURIComponent(songToPlay));
        } else if (artistToPlay && albumToPlay) {
            this.player.playSongFromArtistAndAlbum(artistToPlay, albumToPlay);
        }
        else if (artistToPlay) {
            this.player.playSongFromArtist(artistToPlay);
        } else if (albumToPlay) {
            this.player.playSongFromAlbum(albumToPlay);
        } else {
            this.playNextSong();
        }
    }

    static parseSongToPlayQueryString(): string {
        var songToPlay = Home.parseQueryStringData("song");
        if (songToPlay) {
            // Backwards compat: if we passed in numeric song ID, use the new string IDs.
            var isDeprecatedIdFormat = !isNaN(parseInt(songToPlay, 10));
            if (isDeprecatedIdFormat) {
                return "songs/" + songToPlay;
            }
        }

        return songToPlay ? songToPlay.replace(/\+/g, ' ') : null;
    }

    static parseQueryStringData(name: string) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    playPause() {
        if (this.player.status() === AudioStatus.Playing) {
            this.player.pause();
        } else {
            this.player.resume();
        }
    }

    playNextSong() {
        this.player.pause();

        // If we've got a song request, play that.
        if (this.songRequestManager.hasPendingRequest()) {
            this.songRequestManager.playRequest(this.player);
        } else if (this.stationIdentifier.hasPendingAnnouncement()) {
            this.stationIdentifier.playStationIdAnnouncement(this.player);
        } else if (this.mobileSongBatch.length > 0) {
            this.player.playNewSong(this.mobileSongBatch.splice(0, 1)[0]);
        }
        else {
            new GetSongCommand()
                .execute()
                .done((song: Song) => {
                    this.player.playNewSong(song);
                    this.songRequestManager.removePendingSongRequest(song.id);
                });
        }

        this.fetchSongBatchIfNecessary();
    }

    songStatusChanged(status: AudioStatus) {
        if (status === AudioStatus.Ended) {
            this.playNextSong();

            var currentSong = this.player.song();
            if (currentSong) {
                require(["commands/songCompletedCommand"], (SongCompletedCommand: any) => {
                    new SongCompletedCommand(currentSong.id).execute();
                });
            }
        }

        var errorStates = [AudioStatus.Erred]; // AudioStatus.Stalled, AudioStatus.Aborted
        if (errorStates.indexOf(status) !== -1) {
            // Wait 3 seconds and if we're still stuck on this song, move to the next.
            var currentSong = this.player.song();
            setTimeout(() => {
                if (this.player.song() === currentSong) {
                    this.playNextSong();
                }
            }, 3000);
        }
    }

    likeCurrentSong() {
        if (this.isSignedIn()) {
            var song = this.player.song();
            if (song) {
                song.like();
            }
        } else {
            this.promptSignIn();
        }
    }

    dislikeCurrentSong() {
        if (this.isSignedIn()) {
            var song = this.player.song();
            if (song) {
                song.dislike();
                this.playNextSong();
            }
        } else {
            this.promptSignIn();
        }
    }

    currentSongChanged(song: Song) {
        this.currentArtistBio(" ");
        this.setPlaceHolders(this.recentSongs(), [this.player.playedSongs()[0], this.player.playedSongs()[1], this.player.playedSongs()[2]]);
        window.document.title = song.name + " by " + song.artist + " - Chavah Messianic Radio";

        // Hide all bootstrap tooltips when the song changes. This prevents orphaned tooltips when the song element changes.
        $('.current-song-column .use-bootstrap-tooltip').tooltip('hide');
    }

    fadeIn(element: Node) {
        if (element.nodeType === 1) {
            $(element).hide().fadeIn(1000);
        }
    }

    setPlaceHolders(group: SongPlaceHolder[], songs: Song[]) {
        var isDifferentSong = (first: Song, second: Song) => !first || !second || first.id !== second.id;
        if (isDifferentSong(group[0].song(), songs[0])) {
            setTimeout(() => group[0].enqueuedSong(songs[0]), 300);
        } 
        if (isDifferentSong(group[1].song(), songs[1])) {
            setTimeout(() => group[1].enqueuedSong(songs[1]), 700);
        }
        if (isDifferentSong(group[2].song(), songs[2])) {
            setTimeout(() => group[2].enqueuedSong(songs[2]), 1000);
        }
    }

    setupRecurringFetches() {
        var getLikedSongs = () => {
            new GetRandomLikedSongsCommand(3)
                .execute()
                .done((songs: Song[]) => this.setPlaceHolders(this.likedSongs(), songs))
                .always(() => setTimeout(() => getLikedSongs(), 15000));
        };

        var getTrendingSongs = () => {
            new GetTrendingSongsCommand(3)
                .execute()
                .done((songs: Song[]) => this.setPlaceHolders(this.trendingSongs(), songs))
                .always(() => setTimeout(() => getTrendingSongs(), 10000));
        }

        var getTopSongs = () => {
            new GetTopSongsCommand(3)
                .execute()
                .done((songs: Song[]) => this.setPlaceHolders(this.topSongs(), songs))
                .always(() => setTimeout(() => getTopSongs(), 30000));
        }

        var ping = () => {
            new PingCommand()
                .execute()
                .always(() => setTimeout(() => ping(), 60000));
        }

        setTimeout(() => getLikedSongs(), 1);
        setTimeout(() => getTrendingSongs(), 300);
        setTimeout(() => getTopSongs(), 600);
        setTimeout(() => ping(), 30000);
    }

    showSongRequestDialog() {
        if (this.isSignedIn()) {
            require(["viewmodels/requestSongDialog"], (RequestSongDialog: any) => {
                var dialog = new RequestSongDialog();
                App.showDialog(dialog)
                    .done((songOrNull: Song) => {
                        if (songOrNull) {
                            this.player.pause();
                            this.songRequestManager.requestSong(songOrNull);
                            this.playNextSong();
                        }
                    });
            });
        } else {
            this.promptSignIn();
        }
    }

    showShareDialog(tabIndex: number) {
        var song = this.player.song();
        if (song) {
            require(["viewmodels/shareSongDialog"], (ShareSongDialog: any) => {
                var dialog = new ShareSongDialog(song, tabIndex);
                App.showDialog(dialog);
            });
        }
        
    }

    showMyLikes() {
        if (this.isSignedIn()) {
            require(["viewmodels/songLikesDialog"], (SongLikesDialog: any) => {
                var vm = new SongLikesDialog();
                App.showDialog(vm)
                    .done((songOrNull: Song) => {
                        if (songOrNull) {
                            this.player.playSongById(songOrNull.id);
                        }
                    });
            });
        } else {
            this.promptSignIn();
        }
    }

    fetchSongBatchIfNecessary() {
        // Detect if we're on one of the phone OSes. If so, we need to fetch a bundle of song URIs
        // so that if the user turns off the screen, we can keep playing audio by just switching the URI.
        // This is needed because some mobile devices don't allow AJAX requests while the screen is off.
        var mobileAgents: RegExp[] = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];
        var isMobile = mobileAgents.some(a => navigator.userAgent.match(a) != null && navigator.userAgent.match(a).length > 0);
        if (isMobile && this.mobileSongBatch.length === 0) {
            require(["commands/getSongBatchCommand"], GetSongBatchCommand => {
                new GetSongBatchCommand()
                    .execute()
                    .done((results: Song[]) => this.mobileSongBatch = this.mobileSongBatch.concat(results));
            });
        }
    }

    loadLoginInfo() {
        new GetLoggedInUserNameCommand()
            .execute()
            .done((results: string) => {
                navigator.id.watch({
                    loggedInUser: results,
                    onlogin: (assertion: string) => this.signIn(assertion),
                    onlogout: () => this.signOut()
                }); 
            });
    }

    private promptSignIn() {
        require(["viewmodels/promptSignIn"], (PromptSignIn: any) => {
            var dialog = new PromptSignIn();
            App.showDialog(dialog);
        });
    }

    private isSignedIn(): boolean {
        return !!this.signedInUserName();
    }

    private signIn(assertion: string) {
        ko.postbox.publish("SignedInUserChanging");
        new SignInCommand(assertion)
            .execute()
            .done(userName => ko.postbox.publish("SignedInUserChanged", userName))
            .fail(() => ko.postbox.publish("SignedInUserChanged", ""));
    }

    private signOut() {
        new SignOutCommand()
            .execute()
            .done(() => ko.postbox.publish("SignedInUserChanged", ""));
    }

    private showSongInfo() {
        var currentSong = this.player.song();
        if (currentSong) {
            require(["viewmodels/songDialog"], (SongDialog: any) => {
                var vm = new SongDialog(currentSong);
                App.showDialog(vm);  
            });
        }
    }
}

export = Home;