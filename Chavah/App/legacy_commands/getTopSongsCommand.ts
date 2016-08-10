import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetTopSongsCommand extends CommandBase {
    constructor(private count) {
        super();
    }

    execute(): JQueryPromise<Song[]> {
        var selector = (dtos: SongDto[]) => dtos.map(d => new Song(d));
        return this.query("/api/songs/top/" + this.count, null, selector);
    }
}

export = GetTopSongsCommand;  