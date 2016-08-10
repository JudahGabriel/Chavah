import Dialog = require("plugins/dialog");
import Song = require("models/song");

class SongDialog {

    constructor(private song: Song) {
        song.fetchIndividualRanks();
    }

    close() {
        Dialog.close(this);
    }
}

export = SongDialog;