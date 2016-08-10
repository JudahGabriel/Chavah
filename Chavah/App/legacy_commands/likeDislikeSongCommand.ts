import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class LikeDislikeSongCommand extends CommandBase {
    constructor(private songId: string, private like: boolean) {
        super();
    }

    execute(): JQueryPromise<number> {
        var likeString = this.like ? "like" : "dislike";
        var url = "/api/likes/" + likeString + "/" + this.songId;
        return this.post(url, null);
    }
}

export = LikeDislikeSongCommand; 