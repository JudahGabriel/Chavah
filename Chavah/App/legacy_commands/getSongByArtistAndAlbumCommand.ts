import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetSongByArtistAndAlbumCommand extends CommandBase {

    constructor(private artist: string, private album) {
        super();
    }

    execute(): JQueryPromise<Song> {
        var url = "/api/songs/getsongbyartistandalbum";
        var args = {
            artist: this.artist,
            album: this.album
        };
        var selector = (dto: SongDto) => new Song(dto);
        return this.query(url, args, selector);
    }
}

export = GetSongByArtistAndAlbumCommand; 