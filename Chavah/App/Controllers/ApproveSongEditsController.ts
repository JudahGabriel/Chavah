namespace BitShuva.Chavah {
    export class ApproveSongEditsController {

        pendingEdits: Server.ISongEdit[] = [];
        currentEdit: Server.ISongEdit | null = null;
        isSaving = false;
        hasLoaded = false;
        currentEditOldCsv = "";
        currentEditNewCsv = "";

        constructor(private songEditApi: SongEditService) {
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
            if (songEdit) {
                this.currentEditNewCsv = songEdit.newTags.join(", ");
                this.currentEditOldCsv = songEdit.oldTags.join(", ");
            }
        }

        approve() {
            var edit = this.currentEdit;
            if (!this.isSaving && edit) {
                this.isSaving = true;
                this.songEditApi.approve(edit)
                    .then(results => this.removeSongEdit(results.id))
                    .finally(() => this.isSaving = false);
            }
        }

        reject() {
            var edit = this.currentEdit;
            if (!this.isSaving && edit) {
                this.isSaving = true;
                this.songEditApi.reject(edit.id)
                    .then(result => {
                        if (result) {
                            this.removeSongEdit(result.id);
                        }
                    });
            }
        }

        removeSongEdit(editId: string) {
            this.pendingEdits = this.pendingEdits.filter(e => e.id !== editId);
            if (this.currentEdit && this.currentEdit.id === editId) {
                this.currentEdit = this.pendingEdits[0];
            }
        }
    }

    App.controller("ApproveSongEditsController", ApproveSongEditsController)
}