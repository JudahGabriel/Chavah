import CommandBase = require("commands/commandBase");

class UploadSongCommand extends CommandBase {
    constructor(private tempAddress: string, private fileName: string) {
        super();
    }

    execute(): JQueryPromise<any> {
        var url = "/api/songs/admin/upload";
        var args = {
            address: this.tempAddress,
            fileName: this.fileName
        };
        return this.post(url, args);
    }
}

export = UploadSongCommand; 