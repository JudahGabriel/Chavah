import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class SaveSongCommand extends CommandBase {
    constructor(private song: Song) {
        super();
    }

    execute(): JQueryPromise<Song> {
        var url = "/api/songs/admin/save";
        var selector = (dto: SongDto) => new Song(dto);
        return this.post(url, this.song.toDto(), selector);
    }
}

export = SaveSongCommand;