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

        unlikeSong(song: Song) {
            this.saving = true;
            song.songLike = SongLike.Unranked;
            this.likeApi.dislikeSong(song.id)
                .then(rank => {
                    song.communityRank = rank;
                    this.close();
                })
                .finally(() => this.saving = false);
        }
    }

    App.controller("ConfirmUnlikeSongController", ConfirmUnlikeSongController);
}
