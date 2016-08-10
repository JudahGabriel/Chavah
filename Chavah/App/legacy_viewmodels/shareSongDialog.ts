import Song = require("models/song");
import Dialog = require("plugins/dialog");

class RequestSongDialog {
    songTitle = "";
    songUri = "";
    songEmbedCode = "";
    songAlbumArt = "";
    activeTabIndex = ko.observable<number>();
    
    constructor(private song: Song, activeTabIndex: number) {
        this.songTitle = song.artist + " - " + song.name;
        this.songUri = "http://messianicradio.com/?song=" + song.id;
        this.songEmbedCode = '<iframe src="http://messianicradio.com/home/embed?song=' + song.id + '" scrolling="none" style="width: 350px; height: 430px; border: none;"></iframe>';
        this.songAlbumArt = song.albumArtUri;
        this.activeTabIndex(activeTabIndex);
    }

    attached() {
        if (this.activeTabIndex() === 0) {
            this.showLink();
        } else {
            this.showEmbed();
        }
    }

    showLink() {
        this.activeTabIndex(0);
        setTimeout(() => {
            $("#linkSongTabContent input").focus();
            $("#linkSongTabContent input").select();
        }, 250);
    }

    showEmbed() {
        this.activeTabIndex(1);
        setTimeout(() => {
            $("#embedSongTabContent textarea").focus();
            $("#embedSongTabContent textarea").select();
        });
    }

    close() {
        Dialog.close(this);
    }
}

export = RequestSongDialog;