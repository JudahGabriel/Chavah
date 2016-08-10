import CommandBase = require("commands/commandBase");

class SaveArtistCommand extends CommandBase {
    constructor(private artist: server.Artist) {
        super();
    }

    execute(): JQueryPromise<server.Artist> {
        var url = "/api/artists/admin/save";
        return this.post(url, this.artist);
    }
}

export = SaveArtistCommand; 