namespace BitShuva.Chavah {
    export interface IAudioErrorInfo {
        errorCode: MediaError | null;
        songId: string | null;
        trackPosition: number | null;
    }
}
