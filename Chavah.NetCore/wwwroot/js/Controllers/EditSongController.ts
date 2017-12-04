namespace BitShuva.Chavah {
    export class EditSongController {

        static $inject = [
            "songApi",
            "songEditApi",
            "tagApi",
            "accountApi",
            "appNav",
            "$routeParams",
        ];

        song: Song | null = null;
        tagsInput = "";
        isSaving = false;
        isSaveSuccess = false;
        isSaveFail = false;
        tags: string[] = [];
        readonly isAdmin: boolean;
        isLyricsFocused = true;
        tagPlaceholder = "piano, violin, male vocal, hebrew, psalms";

        constructor(
            private songApi: SongApiService,
            private songEditApi: SongEditService,
            private tagApi: TagService,
            accountApi: AccountService,
            appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService) {

            if (!accountApi.isSignedIn) {
                appNav.promptSignIn();
            } else {
                let songId = "songs/" + $routeParams["id"];
                if (songId) {
                    songApi.getSongById(songId)
                        .then(result => this.songLoaded(result));
                }

                this.isAdmin = !!accountApi.currentUser && accountApi.currentUser.isAdmin;
            }
        }

        searchTags(search: string): ng.IPromise<string[]> {
            return this.tagApi.searchTags(search);
        }

        songLoaded(song: Song | null) {
            this.song = song;
            if (song) {
                this.tags = song.tags || [];
                if (this.tags.length > 0) {
                    this.tagPlaceholder = "";
                }
            }
        }

        tagsInputChanged() {
            // If the user typed a comma, add any existing tag
            if (this.tagsInput.includes(",")) {
                let tags = this.tagsInput.split(",");
                this.tagsInput = "";
                tags.filter(t => t && t.length > 1).forEach(t => this.addTag(t));
            }
        }

        removeTag(tag: string) {
            let tagIndex = this.tags.indexOf(tag);
            if (tagIndex >= 0) {
                this.tags.splice(tagIndex, 1);
            }
        }

        autoCompleteTagSelected(tag: string) {
            this.addTag(tag);
            this.tagsInput = "";
        }

        addTag(tag: string) {
            let tagLowered = tag.toLowerCase().trim();
            if (!this.tags.includes(tagLowered) && tagLowered.length > 1) {
                this.tags.push(tagLowered);
                this.tagPlaceholder = "";
            }
        }

        tagsEnterKeyPressed() {
            if (this.tagsInput.length > 1) {
                this.autoCompleteTagSelected(this.tagsInput);
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
