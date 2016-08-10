import CommandBase = require("commands/commandBase");

class DeleteArtistCommand extends CommandBase {
    constructor(private artist: server.Artist) {
        super();
    }

    execute(): JQueryPromise<any> {
        var url = "/api/artists/admin/delete/" + this.artist.Id;
        return this.del(url);
    }
}

export = DeleteArtistCommand; 