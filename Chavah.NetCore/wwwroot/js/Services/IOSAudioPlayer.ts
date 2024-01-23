namespace BitShuva.Chavah {
    /**
     * Provides an interface to play audio natively on iOS. Used by our webview-based iOS app.
     * Why? Because as of 2024 (iOS 17.2.1), HTML audio cannot play new songs if the app is in the background or if the screen is off. See https://twitter.com/JudahGabriel/status/1748246465863205110
     *
     * This emits events to our iOS app to play the audio and set media session info.
     * It also listens for events from the iOS app, such as iosaudiotimeupdate to indicate playback position.
     */
    export class IOSAudioPlayer implements PlatformAudio {
        private _src: string | null = null;
        private _currentTime = 0;
        private _volume = 1;
        private _duration = 0;
        private readonly eventTarget = new EventTarget();
        private readonly _isIOSWebApp: boolean;

        public error: MediaError | null = null;

        constructor() {
            this._isIOSWebApp = navigator.userAgent.includes("Chavah iOS WKWebView");

            if (this.isIOSWebApp) {
                // Our iOS webview will send these events to use when their equivalents happen in native.
                window.addEventListener("iosaudioended", () => this.dispatchEvent(new CustomEvent("ended")));
                window.addEventListener("iosaudioerror", (e: ErrorEvent) => this.dispatchEvent(e));
                window.addEventListener("iosaudiopause", () => this.dispatchEvent(new CustomEvent("pause")));
                window.addEventListener("iosaudioplay", () => this.dispatchEvent(new CustomEvent("play")));
                window.addEventListener("iosaudioplaying", () => this.dispatchEvent(new CustomEvent("playing")));
                window.addEventListener("iosaudiowaiting", () => this.dispatchEvent(new CustomEvent("waiting")));
                window.addEventListener("iosaudiostalled", () => this.dispatchEvent(new CustomEvent("stalled")));
                window.addEventListener("iosaudiotimeupdate", (e: CustomEvent) => {
                    this._currentTime = e.detail.currentTime;
                    this._duration = e.detail.duration;
                    this.dispatchEvent(new CustomEvent("timeupdate"));
                });
            }
        }

        get src(): string | null {
            return this._src;
        }

        set src(val: string | null) {
            this._src = val;
            this.postMessageToNative("src", val);
        }

        get currentTime(): number {
            return this._currentTime;
        }

        set currentTime(val: number) {
            this._currentTime = val;
            this.postMessageToNative("currentTime", val);
        }

        get volume(): number {
            return this._volume;
        }

        set volume(val: number) {
            this._volume = val;
            this.postMessageToNative("volume", val);
        }

        get duration(): number {
            return this._duration;
        }

        pause(): void {
            this.postMessageToNative("pause");
        }

        play(): Promise<unknown> {
            this.postMessageToNative("play");
            return Promise.resolve();
        }

        load(): void {
            // no op on iOS native audio.
        }

        addEventListener<K extends keyof HTMLMediaElementEventMap>(type: K, listener: (this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void {
            this.eventTarget.addEventListener(type, listener, options);
        }

        /**
         * Tells iOS web app to set media session info.
         */
        setMediaSession(album: string, artist: string, songTitle: string, artwork: string): void {
            const args = JSON.stringify({
                album,
                artist,
                songTitle,
                artwork
            });
            this.postMessageToNative("mediasession", args);
        }

        get isIOSWebApp(): boolean {
            return this._isIOSWebApp;
        }

        private dispatchEvent<K extends keyof HTMLMediaElementEventMap>(ev: HTMLMediaElementEventMap[K]): void {
            this.eventTarget.dispatchEvent(ev);
        }

        private postMessageToNative(message: string, args?: string | number | null) {
            const iosWebViewAudioHandler = this.isIOSWebApp && (window as any).webkit?.messageHandlers?.audiohandler;
            if (iosWebViewAudioHandler) {
                iosWebViewAudioHandler.postMessage({
                    action: message,
                    details: args
                });
            }
        }
    }

    App.service("iosAudioPlayer", IOSAudioPlayer);
}
