namespace BitShuva.Chavah {
    export class Album implements Server.IAlbum {
        artist: string;
        name: string;
        albumArtUri: string;
        id: string;
        backgroundColor: string;
        foregroundColor: string;
        mutedColor: string;
        textShadowColor: string;
        isVariousArtists: boolean;

        isSaving = false;

        constructor(serverObj: Server.IAlbum) {
            angular.merge(this, serverObj);
        }
    }
}