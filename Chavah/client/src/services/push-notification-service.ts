import { httpApi } from "./http-api-service";
import { getHomeViewModel } from "../shared/home-view-model";

type NotificationPermissionResult = "granted" | "denied" | "default";

/**
 * Provides a means to subscribe to PWA push notifications from Chavah. These
 * notifications are typically announcements of new music and features.
 * Ported from the original AngularJS `PushNotificationService`; the `$q`-based
 * deferreds are replaced with native promises.
 *
 * @see https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
 */
export class PushNotificationService {
  /** Whether this device/browser can subscribe to push notifications. */
  async isSupported(): Promise<boolean> {
    try {
      const mgr = await this.getPushManager();
      return !!mgr;
    } catch {
      return false;
    }
  }

  /** Gets the subscription permission status for the current device. */
  async getStatus(): Promise<PermissionState> {
    const mgr = await this.getPushManager();
    return this.getPermissionStateFromManager(mgr);
  }

  /**
   * Whether push notifications are supported, haven't been blocked, and there's
   * no current subscription.
   */
  async canSubscribe(): Promise<boolean> {
    try {
      const [state, sub] = await Promise.all([this.getStatus(), this.getExistingPushSubscription()]);
      return state !== "denied" && !sub;
    } catch {
      return false;
    }
  }

  /** Whether we already have a subscription on this device. */
  async isSubscribed(): Promise<boolean> {
    const sub = await this.getExistingPushSubscription();
    return !!sub;
  }

  /** Prompts the user to accept push notifications. */
  askPermission(): Promise<NotificationPermissionResult> {
    return new Promise((resolve, reject) => {
      // The old Push Notifications spec took a callback; the new one returns a
      // promise. Handle both since we can't tell which the browser implements.
      const permissionResult = Notification.requestPermission((result) => resolve(result as NotificationPermissionResult));
      if (permissionResult) {
        permissionResult.then((result) => resolve(result as NotificationPermissionResult)).catch(reject);
      }
    });
  }

  /**
   * Creates a push subscription and stores it on the server. Should only be
   * called after permission was granted via {@link askPermission}.
   */
  async subscribe(): Promise<unknown> {
    const registration = await this.getSvcWorkerRegistration();
    const subscription = await this.createSubscription(registration);
    return this.storePushNotificationSubscription(subscription);
  }

  /** Unsubscribes this device's existing push notification subscription. */
  async unsubscribe(): Promise<boolean> {
    const subscription = await this.getExistingPushSubscription();
    if (!subscription) {
      throw new Error("No subscription");
    }
    const unsubResult = await subscription.unsubscribe();
    this.deleteSubscription(subscription);
    return unsubResult;
  }

  private async getExistingPushSubscription(): Promise<PushSubscription | null> {
    const mgr = await this.getPushManager();
    if (!mgr) {
      throw new Error("No push manager");
    }
    return mgr.getSubscription();
  }

  private deleteSubscription(subscription: PushSubscription): void {
    void httpApi.post("/api/pushnotifications/delete", subscription);
  }

  private storePushNotificationSubscription(subscription: PushSubscription | null): Promise<unknown> {
    if (subscription) {
      return httpApi.post("/api/pushnotifications/store", subscription);
    }
    return Promise.reject(new Error("No subscription"));
  }

  private async createSubscription(registration: ServiceWorkerRegistration | null): Promise<PushSubscription | null> {
    if (!registration) {
      throw new Error("No registration");
    }
    const subscribeOptions: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(getHomeViewModel().pushNotificationsPublicKey),
    };
    return registration.pushManager.subscribe(subscribeOptions);
  }

  private async getSvcWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!navigator.serviceWorker) {
      throw new Error("No service worker");
    }
    return (await navigator.serviceWorker.ready) || null;
  }

  private async getPushManager(): Promise<PushManager | null> {
    const reg = await this.getSvcWorkerRegistration();
    return reg && reg.pushManager ? reg.pushManager : null;
  }

  private async getPermissionStateFromManager(manager: PushManager | null): Promise<PermissionState> {
    if (!manager) {
      throw new Error("No push manager");
    }
    try {
      return await manager.permissionState({ userVisibleOnly: true });
    } catch {
      // Chrome 71 throws a DOMException here if we unregistered. Default to prompt.
      return "prompt";
    }
  }

  /**
   * Converts a base64 VAPID public key to the Uint8Array the Push API expects.
   * @see https://github.com/GoogleChromeLabs/web-push-codelab/issues/46#issuecomment-429273981
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotifications = new PushNotificationService();
