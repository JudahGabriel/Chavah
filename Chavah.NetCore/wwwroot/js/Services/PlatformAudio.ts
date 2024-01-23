namespace BitShuva.Chavah {
    /**
     * Abstraction of HTML5 audio. On web and places that fully support HTML5 audio, it's implemented by actual HTML5 <audio> element.
     * On platforms like iOS that have bugs or poor implementation of HTML5 audio, it is implemented by native audio on that platform.
     */
    export interface PlatformAudio {
        src: string | null;
        currentTime: number;
        volume: number;
        readonly duration: number;
        error: MediaError | null;
        pause(): void;
        load(): void;
        play(): Promise<unknown>;
        addEventListener<K extends keyof HTMLMediaElementEventMap>(type: K, listener: (this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    }
}
