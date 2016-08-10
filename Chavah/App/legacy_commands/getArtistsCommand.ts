import CommandBase = require("commands/commandBase");

class GetArtistsCommand extends CommandBase {

    constructor(private search: string, private skip: number, private take: number) {
        super();
    }

    execute(): JQueryPromise<server.PagedList> {
        var url = "/api/artists/all";
        var args = {
            search: this.search,
            skip: this.skip,
            take: this.take
        };
        return this.query(url, args);
    }
}

export = GetArtistsCommand;  