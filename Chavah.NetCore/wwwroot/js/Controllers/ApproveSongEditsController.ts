namespace BitShuva.Chavah {
    export class ApproveSongEditsController {

        static $inject = [
            "songApi",
            "songEditApi",
            "tagApi",
        ];

        pendingEdits: Server.ISongEdit[] = [];
        currentEdit: Server.ISongEdit | null = null;
        isSaving = false;
        hasLoaded = false;
        tagsInput: string = "";

        constructor(
            private songApi: SongApiService,
            private songEditApi: SongEditService,
            private tagApi: TagService) {

            this.songEditApi.getPendingEdits(20)
                .then(results => this.pendingEditsLoaded(results));
        }

        pendingEditsLoaded(results: Server.ISongEdit[]) {
            this.pendingEdits = results;
            this.setCurrentEdit(results[0]);
            this.hasLoaded = true;
        }

        setCurrentEdit(songEdit: Server.ISongEdit | null) {
            this.currentEdit = songEdit;
        }

        approve() {
            let edit = this.currentEdit;
            if (!this.isSaving && edit) {
                this.isSaving = true;
                this.songEditApi.approve(edit)
                    .then(results => this.removeSongEdit(results.id))
                    .finally(() => this.isSaving = false);
            }
        }

        reject() {
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
    }

    App.controller("ApproveSongEditsController", ApproveSongEditsController);
}
