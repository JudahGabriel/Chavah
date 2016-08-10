import CommandBase = require("commands/commandBase");
import Song = require("models/song");

class GetAdminSongsCommand extends CommandBase {
    constructor(private skip: number, private take: number) {
        super();
    }

    execute(): JQueryPromise<PagedListDto<Song>> {
        var url = "/api/songs/admin/list/" + this.skip + "/" + this.take;
        var selector = (results: PagedListDto<any>) => {
            results.Items = results.Items.map((dto: SongDto) => new Song(dto));
            return results;
        }
        return this.query(url, null, selector);
    }
}

export = GetAdminSongsCommand;