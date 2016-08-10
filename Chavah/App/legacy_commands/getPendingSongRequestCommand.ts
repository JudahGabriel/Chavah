import CommandBase = require("commands/commandBase");

class GetPendingSongRequestCommand extends CommandBase {
    execute(): JQueryPromise<string> {
        return this.query("/api/requests/pending");
    }
}

export = GetPendingSongRequestCommand;