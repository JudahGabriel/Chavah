import Home = require("viewmodels/home");
import AudioStatus = require("common/audioStatus");

class embed extends Home {
    showEmbeddedSongEnded = ko.observable(false);
    songFromArtistUrl: KnockoutComputed<string>;
    songFromAlbumUrl: KnockoutComputed<string>;

    constructor() {
        super();
        this.songFromArtistUrl = ko.computed(() => this.player.song() ? "http://messianicradio.com/?artist=" + encodeURIComponent(this.player.song().artist) : "#");
        this.songFromAlbumUrl = ko.computed(() => this.player.song() ? "http://messianicradio.com/?album=" + encodeURIComponent(this.player.song().album) : "#");
    }

    pickInitialSongToPlay() {
        var songId = Home.parseSongToPlayQueryString();
        if (songId) {
            this.player.pauseSongById(songId);
        }
    }

    songStatusChanged(status: AudioStatus) {
        if (status === AudioStatus.Ended) {
            this.showEmbeddedSongEnded(true);
        }
    }

    setupRecurringFetches() {
    }

    loadLoginInfo() {
    }
}

export = embed;