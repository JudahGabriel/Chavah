namespace BitShuva.Chavah {
    export class ConfirmDeleteSongController {
        saving = false;

        static $inject = [
            "song",
            "songApi",
            "$uibModalInstance"
        ];

        constructor(
            private readonly song: Song,
            private readonly songApi: SongApiService,
            private $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance) {

        }

        close() {
            this.$uibModalInstance.close(false);
        }

        deleteSong() {
            if (!this.saving) {
                this.saving = true;
                this.songApi.deleteSong(this.song)
                    .then(() => this.$uibModalInstance.close(true))
                    .finally(() => this.saving = false);
            }
        }
    }

    App.controller("ConfirmDeleteSongController", ConfirmDeleteSongController);
}