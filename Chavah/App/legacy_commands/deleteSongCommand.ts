import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class DeleteSongCommand extends CommandBase {
    constructor(private song: Song) {
        super();
    }

    execute(): JQueryPromise<any> {
        var url = "/api/songs/admin/delete/" + this.song.id;
        return this.del(url);
    }
}

export = DeleteSongCommand; 