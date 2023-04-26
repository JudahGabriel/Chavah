namespace BitShuva.Chavah {
    /**
     * Controller for a UI component showing a paged list of songs. Used in the My Likes, Trending, and Popular pages.
     * */
    export class SongDeckController {
        songs: PagedList<Song>; // injected from component
        showLoadMore: boolean; // injected from component
        canNativeShare: boolean;

        static $inject = [
            "audioPlayer",
            "sharing"
        ];

        constructor(
            private readonly audioPlayer: AudioPlayerService,
            private readonly sharing: SharingService) {
            
            this.canNativeShare = this.sharing.canNativeShare;
        }

        $onInit() {
            // If we rehydrated some songs from cache, no need to fetch.
            if (this.songs.items.length === 0) {
                this.songs.fetchNextChunk();this.sharing.nativeShare
            }
        }

        playSong(song: Song) {
            // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
            const clone = new Song(song);
            clone.setSolePickReason(SongPick.YouRequestedSong);
            this.audioPlayer.playNewSong(clone);
        }
    }

    App.component("songDeck", {
        templateUrl: FindAppView("SongDeck.html"),
        controller: SongDeckController,
        controllerAs: "vm",
        bindings: {
            songs: AngularBindings.OneWay,
            showLoadMore: AngularBindings.OneWay
        }
    });
}
