namespace BitShuva.Chavah {
    export class EditSongController {

        song: Song | null = null;
        tagsCsv = "";
        isSaving = false;
        isSaveSuccess = false;
        isSaveFail = false;
        readonly isAdmin: boolean;
        isLyricsFocused = true;

        static $inject = [
            "songApi",
            "songEditApi",
            "accountApi",
            "appNav",
            "$routeParams"
        ];

        constructor(
            private songApi: SongApiService,
            private songEditApi: SongEditService,
            accountApi: AccountService,
            appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService) {

            if (!accountApi.isSignedIn) {
                appNav.promptSignIn();
            } else {
                var songId = "songs/" + $routeParams["id"];
                if (songId) {
                    songApi.getSongById(songId)
                        .then(result => this.songLoaded(result));
                }

                this.isAdmin = !!accountApi.currentUser && accountApi.currentUser.isAdmin;
            }
        }

        songLoaded(song: Song | null) {
            this.song = song;
            if (song) {
                this.tagsCsv = song.tags ? song.tags.join(", ") : "";
            }
        }

        submit() {
            if (this.song && !this.isSaving) {
                this.song.tags = this.tagsCsv
                    .split(",")
                    .filter(t => !!t && t.length > 0)
                    .map(t => t.trim());
                this.song.tags = this.song.tags;

                this.isSaving = true;
                this.songEditApi.submit(this.song)
                    .then(() => this.isSaveSuccess = true)
                    .catch(error => this.isSaveFail = true)
                    .finally(() => this.isSaving = false);
            }
        }
    }

    App.controller("EditSongController", EditSongController);
}