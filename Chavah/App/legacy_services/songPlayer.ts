import Song = require("models/song");
import AudioStatus = require("common/audioStatus");
import GetSongByIdCommand = require("commands/getSongByIdCommand");
import GetSongByArtistCommand = require("commands/getSongByArtistCommand");
import GetSongByAlbumCommand = require("commands/getSongByAlbumCommand");
import GetSongByArtistAndAlbumCommand = require("commands/getSongByArtistAndAlbumCommand");
import App = require("durandal/app");

class SongPlayer {
    status = ko.observable<AudioStatus>(AudioStatus.Paused);
    song = ko.observable<Song>();
    audio: HTMLAudioElement;
    playedTimeText = ko.observable<string>();
    remainingTimeText = ko.observable<string>();
    playedTimePercentage = ko.observable<number>();
    playedSongs = ko.observableArray<Song>();

    private lastPlayedTime = 0;

    constructor() {
    }

    initialize(audio: HTMLAudioElement) {
        var supportsMp3Audio = Modernizr.audio.mp3;
        if (supportsMp3Audio) {
            this.audio = audio;
            //this.audio.addEventListener("abort", (args) => this.aborted(args));
            this.audio.addEventListener("ended", () => this.status(AudioStatus.Ended));
            this.audio.addEventListener("error", (args) => this.erred(args));
            this.audio.addEventListener("pause", () => this.status(AudioStatus.Paused));
            this.audio.addEventListener("play", () => this.status(AudioStatus.Playing));
            this.audio.addEventListener("playing", () => this.status(AudioStatus.Playing));
            this.audio.addEventListener("waiting", () => this.status(AudioStatus.Buffering));
            this.audio.addEventListener("stalled", (args) => this.stalled(args));
            this.audio.addEventListener("timeupdate", (args) => this.playbackPositionChanged(args));
        } else {
            require(["viewmodels/upgradeBrowserDialog"], (UpgradeBrowserDialog) => {
                App.showDialog(new UpgradeBrowserDialog());
            });
        }
    }

    playNewSong(song: Song) {
        var currentSong = this.song();
        if (currentSong) {
            this.playedSongs.unshift(currentSong);
        }

        this.song(song);
        this.playNewUri(song.uri);
    }

    playNewUri(uri: string) {
        if (this.audio) {
            this.audio.src = '';
            if (uri) {
                this.audio.src = uri;
                this.audio.load();
                this.audio.play();
            }
        }
    }

    playSongById(songId: string) {
        var task = new GetSongByIdCommand(songId).execute();
        this.playSongWhenFinishedLoading(task);
    }

    playSongFromArtistAndAlbum(artist: string, album: string) {
        var task = new GetSongByArtistAndAlbumCommand(artist, album).execute();
        this.playSongWhenFinishedLoading(task);
    }

    playSongFromArtist(artist: string) {
        var task = new GetSongByArtistCommand(artist).execute();
        this.playSongWhenFinishedLoading(task);
    }

    playSongFromAlbum(album: string) {
        var task = new GetSongByAlbumCommand(album).execute();
        this.playSongWhenFinishedLoading(task);
    }

    playSongWhenFinishedLoading(task: JQueryPromise<Song>) {
        var currentSong = this.song();
        this.pause();

        task.done((s) => {
            if (this.song() === currentSong) {
                this.playNewSong(s);
            }
        });
    }

    pauseSongById(songId: string) {
        this.pause();

        new GetSongByIdCommand(songId)
            .execute()
            .done((song: Song) => {
                var currentSong = this.song();
                if (currentSong) {
                    this.playedSongs.unshift(currentSong);
                }

                // Set the current song and URI. But don't play it.
                this.song(song);
                if (this.audio) { 
                    this.audio.src = song.uri;
                    this.audio.load();
                    this.audio.pause();
                }
            });
    }

    resume() {
        if (this.audio) {
            this.audio.play();
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    }

    aborted(args: any) {
        this.status(AudioStatus.Aborted);
        console.log("Audio aborted", this.audio.currentSrc, args);
    }

    erred(args: any) {
        this.status(AudioStatus.Erred);
        console.log("Audio erred", this.audio.currentSrc, args);
    }

    stalled(args: any) {
        this.status(AudioStatus.Stalled);
        console.log("Audio stalled, unable to stream in audio data.", this.audio.currentSrc, args);
    }

    playbackPositionChanged(args: any) {
        var currentTime = this.audio.currentTime;
        var currentTimeFloored = Math.floor(currentTime);
        var currentTimeHasChanged = currentTimeFloored !== this.lastPlayedTime; 
        if (currentTimeHasChanged) {
            this.lastPlayedTime = currentTimeFloored;
            var duration = this.audio.duration;

            var currentPositionDate = new Date().setMinutes(0, currentTimeFloored);
            var currentPosition = moment(<any>currentPositionDate);
            var remainingTimeDate = new Date().setMinutes(0, duration - currentTimeFloored);
            var remainingTime = moment(<any>remainingTimeDate);

            this.playedTimeText(currentPosition.format("m:ss"));
            this.remainingTimeText(remainingTime.format("m:ss"));
            this.playedTimePercentage(Math.floor((100 / duration) * currentTimeFloored));
        }
    }
}

export = SongPlayer;