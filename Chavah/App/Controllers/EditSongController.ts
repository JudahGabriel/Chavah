namespace BitShuva.Chavah {
    export class EditSongController {

        song: Song | null = null;
        tagsInput = "";
        isSaving = false;
        isSaveSuccess = false;
        isSaveFail = false;
        tags: string[] = [];
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
                this.tags = song.tags || [];
            }
        }

        tagsInputChanged() {
            // If the user typed a comma, add any existing tag
            if (this.tagsInput.includes(",")) {
                var tags = this.tagsInput.split(",");
                this.tagsInput = "";
                tags.filter(t => t && t.length > 1).forEach(t => this.addTag(t));
            }
        }

        removeTag(tag: string) {
            var tagIndex = this.tags.indexOf(tag);
            if (tagIndex >= 0) {
                this.tags.splice(tagIndex, 1);
            }
        }

        addTag(tag: string) {
            var tagLowered = tag.toLowerCase().trim();
            if (!this.tags.includes(tagLowered)) {
                this.tags.push(tagLowered);
            }
        }

        submit() {
            if (this.song && !this.isSaving) {
                this.song.tags = this.tags;

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