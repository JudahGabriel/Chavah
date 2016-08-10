import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongByIdCommand extends CommandBase {

    constructor(private songId: string) {
        super();
    }

    execute(): JQueryPromise<Song> {
        var url = "/api/songs/id/" + encodeURIComponent(this.songId);
        var selector = (dto: SongDto) => new Song(dto);
        return this.query(url, null, selector);
    }
}

export = GetSongByIdCommand;