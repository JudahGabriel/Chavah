import CommandBase = require("commands/commandBase");

class GetLoggedInUserNameCommand extends CommandBase {
    execute(): JQueryPromise<string> {
        var url = "/api/users/authenticatedname";
        return this.query(url, null);
    }
}

export = GetLoggedInUserNameCommand;  