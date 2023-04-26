import { ApiServiceBase } from "./api-service-base";
/**
 * Detects whether the API is reachable, suggesting true offline status.
 * navigator.onLine doesn't work consistently across browser and doesn't always return true status.
 */
export declare class OnlineDetector extends ApiServiceBase {
    private static onlineStatus;
    constructor();
    /**
     * Detects whether we're online by pinging the API. Result of this function is memoized internally; once online status has been checked, we always return that status.
     * @returns A promise containing boolean online status.
     */
    checkOnline(): Promise<boolean>;
    private pingApiWithTimeout;
}
