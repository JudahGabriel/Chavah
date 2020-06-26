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
        tagPlaceholder = "piano, violin, male vocal, hebrew, psalms";
        readonly songId: string;
        contributingArtistsInput = "";

        static $inject = [
            "songEditApi",
            "tagApi",
            "accountApi",
            "appNav",
            "$routeParams",
        ];

        constructor(
            private readonly songEditApi: SongEditService,
            private readonly tagApi: TagService,
            accountApi: AccountService,
            private readonly appNav: AppNavService,
            $routeParams: ng.route.IRouteParamsService) {
            
            this.songId = "songs/" + $routeParams["id"];
            this.isAdmin = !!accountApi.currentUser && accountApi.currentUser.isAdmin;
        }

        $onInit() {
            if (this.songId) {
                this.songEditApi.getSongEdit(this.songId)
                    .then(result => this.songEditLoaded(result));
            }

            this.appNav.goBackUrl = "#/nowplaying";
        }

        searchTags(search: string): ng.IPromise<string[]> {
            return this.tagApi.searchTags(search);
        }

        songEditLoaded(songEdit: Server.SongEdit) {
            this.song = Song.empty();
            this.song.id = songEdit.songId;
            this.song.name = songEdit.newName;
            this.song.hebrewName = songEdit.newHebrewName;
            this.song.album = songEdit.newAlbum;
            this.song.artist = songEdit.newArtist;
            this.song.lyrics = songEdit.newLyrics;
            this.song.albumArtUri = `/api/albums/getAlbumArtBySongId?songId=${songEdit.songId}`;
            this.tags = songEdit.newTags;
            
            if (this.tags.length > 0) {
                this.tagPlaceholder = "";
            }

            this.contributingArtistsInput = songEdit.newContributingArtists.join(", ");
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
            const tagIndex = this.tags.indexOf(tag);
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
                this.song.contributingArtists = this.contributingArtistsInput
                    .split(',')
                    .map(i => i.trim())
                    .filter(i => !!i);

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
