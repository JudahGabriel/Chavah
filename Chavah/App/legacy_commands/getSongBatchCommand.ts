import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongBatchCommand extends CommandBase {

    constructor() {
        super();
    }

    execute(): JQueryPromise<Song[]> {
        var selector = (dtos: SongDto[]) => dtos.map(d => new Song(d));
        var url = "/api/songs/batch";
        return this.query(url, null, selector);
    }
}

export = GetSongBatchCommand; 