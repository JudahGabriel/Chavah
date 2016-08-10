import Song = require("models/song");
import GetSongMatchesCommand = require("commands/getSongMatchesCommand");
import Dialog = require("plugins/dialog");

class RequestSongDialog {
    selectedSongRequest = ko.observable<Song>();
    songRequestMatches = ko.observableArray<Song>();
    songRequestText = ko.observable('');
    requestInputFocused = ko.observable(false);

    constructor() {
        this.songRequestText
            .extend({ throttle: 500 })
            .subscribe(searchText => this.getSongMatches(searchText));
    }

    attached() {
        this.requestInputFocused(true);
    }

    getSongMatches(searchText: string) {
        if (searchText && searchText.length > 2) {
            new GetSongMatchesCommand(searchText)
                .execute()
                .done((songs: Song[]) => {
                    var isWaitingOnThisQuery = this.songRequestText() === searchText;
                    if (isWaitingOnThisQuery) {
                        this.songRequestMatches(songs);
                    }
                });
        }
    }

    requestSelectedSong() {
        var selectedSong = this.selectedSongRequest();
        Dialog.close(this, selectedSong);
    }

    songRequestMatchClicked(song) {
        this.selectedSongRequest(song);
        this.songRequestText(song.artist + " - " + song.name);
        this.songRequestMatches.removeAll();
    }

    resetSelectedSongRequest() {
        this.selectedSongRequest(null);
    }

    close() {
        Dialog.close(this);
    }
}

export = RequestSongDialog;