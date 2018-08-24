namespace BitShuva.Chavah {
    export class EditSongsController {

        songs = new PagedList((skip, take) => this.songApi.getSongsAdmin(skip, take, this.search));
        search = "";

        static $inject = [
            "songApi",
            "appNav"
        ];

        constructor(
            private readonly songApi: SongApiService,
            private readonly appNav: AppNavService) {

        }

        $onInit() {
            this.songs.fetchNextChunk();
        }

        searchChanged() {
            this.songs.resetAndFetch();
        }

        async deleteSong(song: Server.Song) {
            const confirmDeleteDialog = this.appNav.confirmDeleteSong(song);
            const isDeleted = await confirmDeleteDialog.result;
            if (isDeleted) {
                _.pull(this.songs.items, song);
            }
        }
    }

    App.controller("EditSongsController", EditSongsController);
}