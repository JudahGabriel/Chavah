namespace BitShuva.Chavah {
    export interface IAudioErrorInfo {
        errorCode: number | null;
        songId: string | null;
        trackPosition: number | null;
        mp3Url: string | null;
    }
}
