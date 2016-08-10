import CommandBase = require("commands/commandBase");

class SignInCommand extends CommandBase {
    constructor(private assertion: string) {
        super();
    }

    execute(): JQueryPromise<string> {
        var url = "/account/signin";
        var args = {
            assertion: this.assertion
        };
        return this.post(url, args);
    }
}

export = SignInCommand;