namespace BitShuva.Chavah {
    export class ApproveSongEditsController {

        static $inject = [
            "songEditApi",
            "tagApi",
            "accountApi",
        ];

        pendingEdits: Server.SongEdit[] = [];
        currentEdit: Server.SongEdit | null = null;
        isSaving = false;
        hasLoaded = false;
        tagsInput: string = "";

        user: Server.IUserViewModel | null = null;

        constructor(
            private songEditApi: SongEditService,
            private accountApi: AccountService,
            private tagApi: TagService) {

            this.accountApi.signedIn
                .select(() => this.accountApi.currentUser)
                .subscribe(user => this.signedInUserChanged(user));

            this.songEditApi.getPendingEdits(20)
                .then(results => this.pendingEditsLoaded(results));
        }

        pendingEditsLoaded(results: Server.SongEdit[]) {
            this.pendingEdits = results;
            this.setCurrentEdit(results[0]);
            this.hasLoaded = true;
        }

        setCurrentEdit(songEdit: Server.SongEdit | null) {
            this.currentEdit = songEdit;
        }

        approve() {
            if (this.user) {
                let edit = this.currentEdit;
                if (!this.isSaving && edit) {
                    this.isSaving = true;
                    this.songEditApi.approve(edit)
                        .then(results => this.removeSongEdit(results.id))
                        .finally(() => this.isSaving = false);
                }
         
            }
        }

        reject() {
            if (this.user) {
            let edit = this.currentEdit;
                        if (!this.isSaving && edit) {
                            this.isSaving = true;
                            this.songEditApi.reject(edit.id)
                                .then(result => {
                                    if (result) {
                                        this.removeSongEdit(result.id);
                                    }
                                })
                                .finally(() => this.isSaving = false);
                }
            }
        }

        removeSongEdit(editId: string) {
            this.pendingEdits = this.pendingEdits.filter(e => e.id !== editId);
            if (this.currentEdit && this.currentEdit.id === editId) {
                this.setCurrentEdit(this.pendingEdits[0]);
            }
        }

        removeTag(tag: string) {
            if (this.currentEdit) {
                let index = this.currentEdit.newTags.indexOf(tag);
                if (index >= 0) {
                    this.currentEdit.newTags.splice(index, 1);
                }
            }
        }

        autoCompleteTagSelected(tag: string) {
            this.addTag(tag);
            this.tagsInput = "";
        }

        addTag(tag: string) {
            if (this.currentEdit) {
                let tagLowered = tag.toLowerCase().trim();
                if (!this.currentEdit.newTags.includes(tagLowered) && tagLowered.length > 1) {
                    this.currentEdit.newTags.push(tagLowered);
                }
            }
        }

        tagsInputChanged() {
            // If the user typed a comma, add any existing tag
            if (this.tagsInput.includes(",")) {
                let tags = this.tagsInput.split(",");
                this.tagsInput = "";
                tags
                    .filter(t => t && t.length > 1)
                    .forEach(t => this.addTag(t));
            }
        }

        tagsEnterKeyPressed() {
            if (this.tagsInput.length > 1) {
                this.autoCompleteTagSelected(this.tagsInput);
            }
        }

        searchTags(search: string): ng.IPromise<string[]> {
            return this.tagApi.searchTags(search);
        }

        signedInUserChanged(user: User | null) {
            this.user = user;
        }
    }

    App.controller("ApproveSongEditsController", ApproveSongEditsController);
}
