import CommandBase = require("commands/commandBase");

class SignOutCommand extends CommandBase {
    execute(): JQueryPromise<string> {
        var url = "/account/signout";
        return this.post(url);
    }
} 

export = SignOutCommand;