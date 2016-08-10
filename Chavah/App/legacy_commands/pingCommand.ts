import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class PingCommand extends CommandBase {
    execute(): JQueryPromise<any> {
        return this.query("/api/users/ping");
    }
}

export = PingCommand;