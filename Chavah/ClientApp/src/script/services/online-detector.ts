import { ApiServiceBase } from "./api-service-base";

/**
 * Detects whether the API is reachable, suggesting true offline status.
 * navigator.onLine doesn't work consistently across browser and doesn't always return true status.
 */
export class OnlineDetector extends ApiServiceBase {

    private static onlineStatus: boolean | null = null;

    constructor() {
        super();
    }

    /**
     * Detects whether we're online by pinging the API. Result of this function is memoized internally; once online status has been checked, we always return that status.
     * @returns A promise containing boolean online status.
     */
    public checkOnline(): Promise<boolean> {
        if (OnlineDetector.onlineStatus !== null) {
            return Promise.resolve(OnlineDetector.onlineStatus);
        }
        return this.pingApiWithTimeout(3000)
            .then(onlineStatus => OnlineDetector.onlineStatus = onlineStatus);
    }

    private pingApiWithTimeout(timeoutMs: number): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            setTimeout(() => resolve(false), timeoutMs);
            super.getResponse("/")
                .then(response => resolve(response.ok), () => resolve(false));
        });
    }
}