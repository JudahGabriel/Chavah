import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongByAlbumCommand extends CommandBase {

    constructor(private album: string) {
        super();
    }

    execute(): JQueryPromise<Song> {
        var url = "/api/songs/album/" + encodeURIComponent(this.album);
        var selector = (dto: SongDto) => new Song(dto);
        return this.query(url, null, selector);
    }
}

export = GetSongByAlbumCommand; 