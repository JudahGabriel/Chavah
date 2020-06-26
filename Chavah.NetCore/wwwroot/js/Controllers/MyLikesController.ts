namespace BitShuva.Chavah {
    export class MyLikesController {
        songs = new PagedList<Song>((skip, take) => this.songApi.getLikes(skip, take, this.search));
        albums = new PagedList<Server.AlbumWithNetLikeCount>((skip, take) => this.albumApi.getLikedAlbums(skip, take, this.search));
        artists = new PagedList<Server.ArtistWithNetLikeCount>((skip, take) => this.artistApi.getLikedArtists(skip, take, this.search));
        searchText = "";
        activeCategory: LikesCategory = "Songs";
        allCategories: LikesCategory[] = [
            "Songs",
            "Albums",
            "Artists",
            //"Tags" // Commented out for now. We should implement this.
        ];

        static $inject = [
            "songApi",
            "albumApi",
            "artistApi",
            "audioPlayer",
            "sharing",
            "appNav"
        ];

        constructor(
            private readonly songApi: SongApiService,
            private readonly albumApi: AlbumApiService,
            private readonly artistApi: ArtistApiService,
            private readonly audioPlayer: AudioPlayerService,
            private readonly sharing: SharingService,
            private readonly appNav: AppNavService) {

            this.songs.take = 20;
            this.albums.take = 20;
            this.artists.take = 20;
        }

        get search(): string {
            return this.searchText;
        }

        set search(val: string) {
            this.searchText = val;
            this.fetchItemsForCurrentView();
        }

        $onInit() {
            this.songs.fetchNextChunk();
            this.appNav.goBackUrl = "#/nowplaying";
        }

        playSong(song: Song) {
            this.audioPlayer.playSongById(song.id);
            //this.appNav.nowPlaying();
        }

        playAlbum(album: Server.AlbumWithNetLikeCount) {
            this.audioPlayer.playSongFromAlbumId(album.id);
            //this.appNav.nowPlaying();
        }

        playArtist(artist: Server.ArtistWithNetLikeCount) {
            this.audioPlayer.playSongFromArtist(artist.name);
            //this.appNav.nowPlaying();
        }

        loadMoreSongs() {
            this.songs.fetchNextChunk();
        }

        loadMoreAlbums() {
            this.albums.fetchNextChunk();
        }

        loadMoreArtists() {
            this.artists.fetchNextChunk();
        }

        setCategory(category: LikesCategory) {
            if (this.activeCategory !== category) {
                this.activeCategory = category;
                this.fetchItemsForCurrentView();
            }
        }

        fetchItemsForCurrentView() {
            switch (this.activeCategory) {
                case "Songs":
                    this.songs.resetAndFetch();
                    break;
                case "Albums":
                    this.albums.resetAndFetch();
                    break;
                case "Artists":
                    this.artists.resetAndFetch();
                    break;
            }
        }

        getFacebookShareUrl(song: Song): string {
            return this.sharing.facebookShareUrl(song);
        }

        getTwitterShareUrl(song: Song): string {
            return this.sharing.twitterShareUrl(song);
        }
    }

    type LikesCategory = "Songs" | "Albums" | "Artists" | "Tags";

    App.controller("MyLikesController", MyLikesController);
}
