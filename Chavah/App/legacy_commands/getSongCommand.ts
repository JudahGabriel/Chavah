import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongCommand extends CommandBase {

    execute(): JQueryPromise<Song> {
        var selector = (dto: SongDto) => new Song(dto);
        return this.query("/api/songs/get", null, selector);
    }
}

export = GetSongCommand;