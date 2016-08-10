import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class RequestSongCommand extends CommandBase {
    constructor(private songId: string) {
        super();
    }

    execute(): JQueryPromise<any> {
        var args = {
            songId: this.songId
        };
        var url = "/api/requests/request/" + this.urlEncodeArgs(args);
        return this.post(url);
    }
}

export = RequestSongCommand;