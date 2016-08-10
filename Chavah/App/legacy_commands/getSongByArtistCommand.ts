import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongByArtistCommand extends CommandBase {

    constructor(private artist: string) {
        super();
    }

    execute(): JQueryPromise<Song> {
        var url = "/api/songs/artist/" + encodeURIComponent(this.artist);
        var selector = (dto: SongDto) => new Song(dto);
        return this.query(url, this.artist, selector);
    }
}

export = GetSongByArtistCommand; 