var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var MyLikesController = /** @class */ (function () {
            function MyLikesController(songApi, albumApi, artistApi, audioPlayer, sharing, appNav) {
                var _this = this;
                this.songApi = songApi;
                this.albumApi = albumApi;
                this.artistApi = artistApi;
                this.audioPlayer = audioPlayer;
                this.sharing = sharing;
                this.appNav = appNav;
                this.songs = new Chavah.PagedList(function (skip, take) { return _this.songApi.getLikes(skip, take, _this.search); });
                this.albums = new Chavah.PagedList(function (skip, take) { return _this.albumApi.getLikedAlbums(skip, take, _this.search); });
                this.artists = new Chavah.PagedList(function (skip, take) { return _this.artistApi.getLikedArtists(skip, take, _this.search); });
                this.searchText = "";
                this.activeCategory = "Songs";
                this.allCategories = [
                    "Songs",
                    "Albums",
                    "Artists",
                    //"Tags" // Commented out for now. We should implement this.
                ];
                this.songs.take = 20;
                this.albums.take = 20;
                this.artists.take = 20;
            }
            Object.defineProperty(MyLikesController.prototype, "search", {
                get: function () {
                    return this.searchText;
                },
                set: function (val) {
                    this.searchText = val;
                    this.fetchItemsForCurrentView();
                },
                enumerable: false,
                configurable: true
            });
            MyLikesController.prototype.$onInit = function () {
                this.songs.fetchNextChunk();
            };
            MyLikesController.prototype.playSong = function (song) {
                this.audioPlayer.playSongById(song.id);
            };
            MyLikesController.prototype.playAlbum = function (album) {
                this.audioPlayer.playSongFromAlbumId(album.id);
            };
            MyLikesController.prototype.playArtist = function (artist) {
                this.audioPlayer.playSongFromArtist(artist.name);
            };
            MyLikesController.prototype.loadMoreSongs = function () {
                this.songs.fetchNextChunk();
            };
            MyLikesController.prototype.loadMoreAlbums = function () {
                this.albums.fetchNextChunk();
            };
            MyLikesController.prototype.loadMoreArtists = function () {
                this.artists.fetchNextChunk();
            };
            MyLikesController.prototype.setCategory = function (category) {
                if (this.activeCategory !== category) {
                    this.activeCategory = category;
                    this.fetchItemsForCurrentView();
                }
            };
            MyLikesController.prototype.fetchItemsForCurrentView = function () {
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
            };
            MyLikesController.prototype.getFacebookShareUrl = function (song) {
                return this.sharing.facebookShareUrl(song);
            };
            MyLikesController.prototype.getTwitterShareUrl = function (song) {
                return this.sharing.twitterShareUrl(song);
            };
            MyLikesController.$inject = [
                "songApi",
                "albumApi",
                "artistApi",
                "audioPlayer",
                "sharing",
                "appNav"
            ];
            return MyLikesController;
        }());
        Chavah.MyLikesController = MyLikesController;
        Chavah.App.controller("MyLikesController", MyLikesController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=MyLikesController.js.map