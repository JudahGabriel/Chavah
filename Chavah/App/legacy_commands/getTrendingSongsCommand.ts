import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetTrendingSongsCommand extends CommandBase {
    constructor(private count) {
        super();
    }

    execute(): JQueryPromise<Song[]> {
        var selector = (dtos: SongDto[]) => dtos.map(d => new Song(d));
        return this.query("/api/songs/trending/" + this.count, null, selector);
    }
}

export = GetTrendingSongsCommand; 