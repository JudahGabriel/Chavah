import CommandBase = require("commands/commandBase"); 

class SimpleQueryCommand extends CommandBase {
    constructor(private url: string) {
        super();
    }

    execute(): JQueryPromise<any> {
        return this.query(this.url, null, null);
    }
}

export = SimpleQueryCommand;