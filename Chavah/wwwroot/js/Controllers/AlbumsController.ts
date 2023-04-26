namespace BitShuva.Chavah {
    export class AlbumsController {

        static $inject = [
            "albumApi",
            "appNav",
        ];

        search = "";
        albums = new PagedList((skip, take) => this.albumApi.getAll(skip, take, this.search));
        isSaving = false;

        constructor(
            private readonly albumApi: AlbumApiService,
            private readonly appNav: AppNavService) {

            this.albums.take = 50;
            this.albums.fetchNextChunk();
        }

        searchChanged() {
            this.albums.resetAndFetch();
        }

        async deleteAlbum(album: Album) {
            this.isSaving = true;
            try {
                await this.albumApi.deleteAlbum(album.id);
                _.pull(this.albums.items, album);
            } finally {
                this.isSaving = false;
            }
        }
    }

    App.controller("AlbumsController", AlbumsController);
}
