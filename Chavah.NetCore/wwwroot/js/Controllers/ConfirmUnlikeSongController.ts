namespace BitShuva.Chavah {
    export class ConfirmUnlikeSongController {
        saving = false;

        static $inject = [
            "song",
            "likeApi",
            "$uibModalInstance"
        ];

        constructor(
            private readonly song: Song,
            private readonly likeApi: LikeApiService,
            private $uibModalInstance: ng.ui.bootstrap.IModalServiceInstance) {

        }

        close() {
            this.$uibModalInstance.close(false);
        }

        unlikeSong() {
            this.saving = true;
            this.song.songLike = SongLike.Unranked;
            this.likeApi.setSongAsUnranked(this.song.id)
                .then(rank => {
                    this.song.communityRank = rank;
                    this.close();
                })
                .finally(() => this.saving = false);
        }
    }

    App.controller("ConfirmUnlikeSongController", ConfirmUnlikeSongController);
}
