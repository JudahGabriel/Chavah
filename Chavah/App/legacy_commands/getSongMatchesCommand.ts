import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongMatchesCommand extends CommandBase {
    constructor(private searchText) {
        super();
    }

    execute(): JQueryPromise<Song[]> {
        var url = "/api/songs/search?searchText=" + encodeURIComponent(this.searchText);
        var selector = (dtos: SongDto[]) => dtos.map(d => new Song(d));
        return this.query(url, null, selector);
    }
}

export = GetSongMatchesCommand;