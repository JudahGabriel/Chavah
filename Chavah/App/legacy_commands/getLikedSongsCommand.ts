import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetLikedSongsCommand extends CommandBase {
    constructor(private skip: number, private take: number) {
        super();
    }

    execute(): JQueryPromise<PagedListDto<Song>> {
        var selector = (dto: PagedListDto<SongDto>) => {
            return {
                Skip: dto.Skip,
                Take: dto.Take,
                Items: dto.Items.map(i => new Song(i)),
                Total: dto.Total
            }
        };
        return this.query("/api/likes/songs/" + this.skip + "/" + this.take, null, selector);
    }
}

export = GetLikedSongsCommand;   