namespace BitShuva.Chavah {
    export interface AudioErrorInfo {
        errorCode: MediaError | null;
        songId: string | null;
        trackPosition: number | null;
    }
}