import CommandBase = require("commands/commandBase");

class DeleteSongCommand extends CommandBase {
    constructor(private songId: string) {
        super();
    }

    execute(): JQueryPromise<any> {
        var url = "/api/songs/completed/" + this.songId;
        return this.post(url);
    }
}

export = DeleteSongCommand;  