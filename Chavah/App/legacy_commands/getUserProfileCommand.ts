import CommandBase = require("commands/commandBase");

class GetUserProfileCommand extends CommandBase {

    constructor() {
        super();
    }

    execute(): JQueryPromise<server.UserProfile> {
        var url = "/api/users/GetUserProfile";
        return this.query(url);
    }
}

export = GetUserProfileCommand;  