import Song = require("models/song");
import Dialog = require("plugins/dialog");
import SaveSongCommand = require("commands/saveSongCommand");

class AdminEditSongDialog {

    constructor(private song: Song) {
    }

    save() {
        new SaveSongCommand(this.song)
            .execute()
            .done((updatedSong: Song) => {
                this.song.updateFrom(updatedSong);
                Dialog.close(this, this.song);
            });
    }

    close() {
        Dialog.close(this);
    }
}

export = AdminEditSongDialog;