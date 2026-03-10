namespace BitShuva.Chavah {

    interface SongEditViewModel extends Server.SongEdit {
        isSaving: boolean;
    }

    export class ApproveSongEditsController {

        static $inject = [
            "songEditApi",
            "accountApi",
            "tagApi"
        ];

        pendingEdits: SongEditViewModel[] = [];
        currentEdit: SongEditViewModel | null = null;
        hasLoaded = false;
        tagsInput: string = "";

        user: Server.User | null = null;

        constructor(
            private songEditApi: SongEditService,
            private accountApi: AccountService,
            private tagApi: TagService) {

            this.accountApi.signedInState
                .select(() => this.accountApi.currentUser)
                .subscribe(user => this.signedInUserChanged(user));

            this.songEditApi.getPendingEdits(100)
                .then(results => this.pendingEditsLoaded(results));
        }

        pendingEditsLoaded(results: Server.SongEdit[]) {
            this.pendingEdits = results.map(a => this.createSongEditViewModel(a));
            this.setCurrentEdit(this.pendingEdits[0]);
            this.hasLoaded = true;
        }

        setCurrentEdit(songEdit: SongEditViewModel | null) {
            this.currentEdit = songEdit;
        }

        approve() {
            if (this.user) {
                let edit = this.currentEdit;
                if (edit && !edit.isSaving) {
                    edit.isSaving = true;
                    this.songEditApi.approve(edit)
                        .then(results => this.removeSongEdit(results.id))
                        .finally(() => edit!.isSaving = false);
                }
         
            }
        }

        reject() {
            if (this.user) {
                let edit = this.currentEdit;
                if (edit && !edit.isSaving) {
                    edit.isSaving = true;
                    this.songEditApi.reject(edit.id)
                        .then(result => {
                            if (result) {
                                this.removeSongEdit(result.id);
                            }
                        })
                        .finally(() => edit!.isSaving = false);
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

        createSongEditViewModel(songEdit: Server.SongEdit): SongEditViewModel {
            return {
                isSaving: false,
                ...songEdit
            };
        }

        getFriendlyDate(songEdit: Server.SongEdit): string {
            return new Intl.DateTimeFormat("en-US", {
                dateStyle: "short"
            } as any).format(new Date(songEdit.submitDate));
        }

        hasNewerEdit(songEdit: Server.SongEdit): boolean {
            // Find any song edits for the same song ID and a newer submitDate.
            return this.pendingEdits.some(e =>
                e !== songEdit &&
                e.songId === songEdit.songId &&
                new Date(e.submitDate) > new Date(songEdit.submitDate)
            );
        }

        hasLyricChanges(): boolean {
            return !!this.currentEdit && this.currentEdit.oldLyrics !== this.currentEdit.newLyrics;
        }

        hasTagChanges(): boolean {
            if (!this.currentEdit) {
                return false;
            }

            return this.currentEdit.newTags.length !== this.currentEdit.oldTags.length ||
                this.currentEdit.newTags.every((t, i) => this.currentEdit?.oldTags[i] !== t);
        }

        getTagClass(tag: string): string {
            // If a tag has been added, give it the "added-tag" class.
            // If a tag has been removed, give it the "removed-tag" class.
            if (!this.currentEdit) {
                return "";
            }

            const includedInNewTags = this.currentEdit.newTags.includes(tag);
            const includedInOldTags = this.currentEdit.oldTags.includes(tag);

            if (includedInNewTags && !includedInOldTags) {
                return "added-tag";
            } else if (!includedInNewTags && includedInOldTags) {
                return "removed-tag";
            }

            return "";
        }
    }

    App.controller("ApproveSongEditsController", ApproveSongEditsController);
}
