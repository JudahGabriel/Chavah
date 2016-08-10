import CommandBase = require("commands/commandBase");

class GetUpDownVotesCommand extends CommandBase {

    constructor(private songId: string) {
        super();
    }

    execute(): JQueryPromise<UpDownVotesDto> {
        return this.query("/api/likes/upDownVotes/" + encodeURIComponent(this.songId));
    }
}

export = GetUpDownVotesCommand; 