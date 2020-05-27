namespace BitShuva.Chavah {
    /**
     * Controller for a UI component showing a few songs, automatically refreshed every so often. On the home page, we use this component for trending, my likes, recent, and popular.
     * */
    export class SongListController {
        songs: PagedList<Song> | List<Song>; // injected from component
        refreshInterval: number;
        refreshHandle: number | null = null;

        static $inject = [
            "audioPlayer",
            "$q"
        ];

        constructor(
            private readonly audioPlayer: AudioPlayerService,
            private readonly $q: ng.IQService) {
        }

        $onInit() {
            // If we rehydrated some songs from cache, no need to fetch.
            if (this.songs.items.length === 0) {
                // Delay the first fetch up to 5 seconds so as to give some random song item appearances.
                setTimeout(() => this.fetchSongs(), Math.random() * 5000);
            }

            // Set up the recurring fetch.
            if (!this.refreshInterval) {
                this.refreshInterval = 60000;
            }
            if (this.refreshInterval !== -1) {
                this.refreshHandle = setInterval(() => this.fetchSongs(), this.refreshInterval + (Math.random() * 3000));
            }
        }

        $onDestroy() {
            if (this.refreshHandle) {
                clearInterval(this.refreshHandle);
            }
        }

        playSong(song: Song) {
            // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
            const clone = new Song(song);
            clone.setSolePickReason(SongPick.YouRequestedSong);
            this.audioPlayer.playNewSong(clone);
        }

        private fetchSongs() {
            if (this.songs instanceof List) {
                this.songs.fetch();
            } else {
                this.songs.refresh();
            }
        }
    }

    App.component("songList", {
        templateUrl: FindAppView("SongList.html"),
        controller: SongListController,
        controllerAs: "vm",
        bindings: {
            songs: AngularBindings.OneWay,
            refreshInterval: AngularBindings.OneWay
        }
    });
}
