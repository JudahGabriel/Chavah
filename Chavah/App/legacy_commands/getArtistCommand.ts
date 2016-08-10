import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetArtistCommand extends CommandBase {

    constructor(private artist: string) {
        super();
    }

    execute(): JQueryPromise<ArtistDto> {
        var args = {
            artistName: this.artist
        };
        var url = "/api/artists/byname";
        return this.query(url, args);
    }
}

export = GetArtistCommand; 