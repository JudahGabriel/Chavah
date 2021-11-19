// This service worker is cache-first with network fallback for:
// - fingerprinted resources (e.g. foo.html?v=123ABC)
// - app shell related CDN resources ()

'use strict';

const appShellCacheName = "AppShell";
const mediaCacheName = "MediaResources";
const offlinePageUrl = "/views/offline.html";
const unreadCountBackgroundSync = "unread-count-sync";
let storageSpaceAvailable = megaBytesInBytes(250);

/**
* Initializes the caches.
*
* @returns {Promise<void>}
*/
async function initializeCaches() {
    // Delete the old, obsolete cache if it exists.
    await caches.delete("v1.0::CacheFingerprinted");

    // Put the offline page into the cache.
    const appShellCache = await caches.open(appShellCacheName);
    appShellCache.add(offlinePageUrl);

    // See how much space we have available.
    if (navigator.storage && navigator.storage.estimate) {
        const storageEstimate = await navigator.storage.estimate();
        storageSpaceAvailable = storageEstimate.quota - storageEstimate.usage;
    }
}

/**
 * Initializes periodic background sync where supported. Chavah uses periodic sync to periodically fetch unread notification count.
 * @returns {Promise<void>}
 */
async function setupPeriodicSync(registration) {
    // Only do this if badging and permissions are supported.
    if (!navigator.setAppBadge || !navigator.permissions || !navigator.permissions.query) {
        console.warn("Unable to register periodic background sync because of missing functionality in navigator.");
        return;
    }
    
    // Ask the browser if we're able to do this. (Must be an installed PWA, for example.)
    const status = await navigator.permissions.query({ name: "periodic-background-sync" });
    if (status.state !== "granted") {
        console.warn("Periodic background sync couldn't be registered due to status", status.state);
        return;
    }

    if (!registration || !registration.periodicSync) {
        console.warn("Periodic background sync couldn't be registered due to service worker registration missing the periodicSync member.");
        return;
    }

    // Do we already have periodic sync? Punt.
    const syncTags = await registration.periodicSync.getTags();
    if (syncTags.includes(unreadCountBackgroundSync)) {
        console.info("Periodic background sync already setup.");
        return;
    }

    try {
        const oneDayInMs = 24 * 60 * 60 * 1000;
        await registration.periodicSync.register(unreadCountBackgroundSync, {
            minInterval: oneDayInMs
        });
        console.info("Successfully registered periodic background sync.");
    } catch (periodicSyncError) {
        console.warn("Error registering periodic background sync", periodicSyncError);
    }
}

/**
 * Adds the specified request/response pair to the cache.
 * @param {string} cacheName The name of the cache to add the response to.
 * @param {Request} request The request whose response to add to the cache.
 * @param {Response} response The response to add to the cache.
 * @returns {Promise<void>} 
 */
async function addToCache(cacheName, request, response) {
    // If we're short on space, skip adding to the cache.
    if (storageSpaceAvailable < megaBytesInBytes(20)) {
        console.warn("Skipping adding resource to the cache because we're short on storage space", storageSpaceAvailable);
        return;
    }

    const cache = await caches.open(cacheName);
    const clonedResponse = tryCloneResponse(response, request.url);
    const isCdn = isCdnUrl(request.url);
    const isOnline = navigator.onLine;
    const isPartialResponse = response.status === 206 || response.status === 416; // See https://github.com/w3c/ServiceWorker/issues/937
    if (!response.ok) {
        // See if it's an opaque response from our CDN. If so, and we're online, assume it's successful and put it in the cache.
        if (response.type == "opaque" && isCdn && isOnline && !isPartialResponse) {
            await tryPutCache(cache, request, clonedResponse); // .put is required to storage opaque responses.
        } else if (isOnline) {
            console.warn("Attempted to add request to sw cache, but received non-OK response", request, response);
        }
    } else {
        await cache.add(request, clonedResponse);
    }

    // If we added an MP3 or JPG to the cache, update the estimated available space.
    const isMedia = isMediaUrl(request.url);
    if (isMedia) {
        const averageMp3Size = megaBytesInBytes(10);
        const averageJpgSize = megaBytesInBytes(1);
        const responseSizeEstimate = request.url.includes(".mp3") ? averageMp3Size : averageJpgSize;
        storageSpaceAvailable -= responseSizeEstimate;
    }
}

/**
 * Tries to put the specified request and response into the specified cache. Upon failure, we log a warning.
 * @param {Cache} The cache to update.
 * @param {Request} request The request whose response to add to the cache.
 * @param {Response} response The response to add to the cache.
 */
async function tryPutCache(cache, request, response) {
    try {
        await cache.put(request, response); // .put is required to storage opaque responses.
    } catch (cacheError) {
        console.warn("Attempted to put response into the cache, but an error occured.", request, response, cacheError);
    }
}

/**
 * Attempts to clone the specified response. If failed, the original response is returned.
 * @param {Request} request The response to clone
 * @param {string} url The request URL
 */
function tryCloneResponse(response, url) {
    try {
        return response.clone();
    } catch (cloneError) {
        console.warn("Unable to clone response", response, request, cloneError);
        return response;
    }
}

/**
 * Serves an "offline" notification. If the request is for an image, an "offline" SVG will be returned. Otherwise, the offline page will be served.
 * @param {Request} request The request which triggered the offline result.
 * @returns {Promise<Response>} The offline response.
 */
async function serveOfflinePageOrImage(request) {
    const isImageRequest = request.headers.get("Accept")?.includes("image");
    if (isImageRequest) {
        return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', {
            headers: {
                'Content-Type': 'image/svg+xml'
            }
        });
    }

    const appShellCache = await caches.open(appShellCacheName);
    const offlinePageResponse = await appShellCache.match(offlinePageUrl);
    if (offlinePageResponse == null) {
        throw new Error("Couldn't find offline page in the cache.");
    }

    return offlinePageResponse;
}

/**
 * Fetches a response from the network.
 * @param {FetchEvent} event The fetch event.
 * @returns {Promise<Response> | null}
 */
async function fetchFromNetwork(event) {
    try {
        return await fetch(event.request);
    } catch (networkError) {
        console.warn("Failed to make network request", event.request, networkError);
        null;
    }
}

/**
 * Fetches from the network. If the fetch fails, the offline page will be served.
 * @param {any} event
 */
async function fetchNetworkWithOfflineFallback(event) {
    const networkResponse = await fetchFromNetwork(event);
    if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque" || networkResponse.type === "opaqueredirect")) {
        return networkResponse;
    }

    return serveOfflinePageOrImage(event.request);
}

/**
 * Fetches the request from the cache. If not found in the cache, it will be fetched from the network.
 * @param {string} cacheName The name of the cache to find the request in.
 * @param {FetchEvent} event The fetch event.
 * @returns {Promise<Response>}
 */
async function fetchCacheFirst(cacheName, event) {
    const targetCache = await caches.open(cacheName);
    const cacheResponse = await targetCache.match(event.request);
    if (cacheResponse) {
        // We've got it in the cache. Serve it.
        return cacheResponse;
    }

    // It's not in the cache. Fallback to the network and update the cache.
    const networkResponse = await fetchFromNetwork(event);
    if (networkResponse) {
        await addToCache(cacheName, event.request, networkResponse);
        return networkResponse;
    }

    // We couldn't find it in the cache and we couldn't fetch it from the network.
    // Serve the offline image.
    return serveOfflinePageOrImage(event.request);
}

/**
 * Fetches from the network first. If failed, falls back to the cache. If both fail, serves the offline page.
 * Adds network result to the cache.
 * @param {string} cacheName The cache name
 * @param {FetchEvent} event
 */
async function networkFirst(cacheName, event) {
    try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && (networkResponse.ok || networkResponse.type === "opaque")) {
            await addToCache(cacheName, event.request, networkResponse);
            return networkResponse;
        }
    } catch (networkError) {
        console.warn("Error fetching from network in networkFirst fetch. Falling back to cache.", event.request, networkError);
    }

    // Get it from the cache.
    const targetCache = await caches.open(cacheName);
    const cacheResponse = await targetCache.match(event.request);
    if (cacheResponse) {
        return cacheResponse;
    }

    return await serveOfflinePageOrImage(event.request);
}

/**
 * Initializes caches and performs other service worker installation logic.
 * @param {ExtendableEvent} event
 */
function onInstall(event) {
    event.waitUntil(self.skipWaiting()); // Activate worker immediately
    event.waitUntil(initializeCaches());

    // After 30 seconds, setup periodic sync.
    // This is work that doesn't need to be done up-front, hence the timeout.
    setTimeout(() => setupPeriodicSync(self.registration), 30000);
}

/**
 * Performs our service worker fetch logic: fetching fingerprinted and CDN resources from the cache first, then falling back to the network.
 * @param {FetchEvent} event
 */
function onFetch(event) {
    const request = event.request;
    const isFingerprinted = request.url.match(/(\?|&)v=/ig);
    const isCdn = isCdnUrl(request.url);
    const isMediaResource = false; // COMMENTED OUT: if we tried fetching media resources from the cache, iOS would say "stalling" forever. // isMediaUrl(request.url);
    const isHomePage = request.method === "GET" && (request.url === "/" || request.url.endsWith("/#") || request.url.endsWith("/#/"));
    const isApiCall = request.url.includes("messianicradio.com/api/");
    // Always fetch non-GET requests from the network
    try {
        if (request.method !== "GET") {
            // COMMENTED OUT: If we're offline and a POST fails, it should really fail. So let's just use fetchFromNetwork.
            //event.respondWith(fetchNetworkWithOfflineFallback(event));
            event.respondWith(fetchFromNetwork(event));
        } else if (isHomePage) {
            event.respondWith(networkFirst(appShellCacheName, event));
        } else if (isMediaResource) {
            // Cache first for media resources (our MP3s and album art)
            event.respondWith(fetchCacheFirst(mediaCacheName, event));
        } else if (isFingerprinted || isCdn) {
            // Cache first our app shell: fingerprinted resources (our HTML, JS, CSS) and shell-related scripts (jQuery, Bootstrap, and others on various CDNs)
            event.respondWith(fetchCacheFirst(appShellCacheName, event));
        } else if (isApiCall) {
            // For calling the API, always go to the network and don't fallback to an offline page. Doesn't make sense to serve an offline page for an API call. Can hide real errors.
            event.respondWith(fetchFromNetwork(event));
        } else {
            event.respondWith(fetchNetworkWithOfflineFallback(event));
        }
    } catch (fetchError) {
        console.error("Error fetching via service worker.", fetchError, request);
        //event.respondWith(fetch(request));
    }
}

/**
 * Handles the push notification event and displays a notification to the user.
 * @param {PushEvent} event
 */
function onPushNotificationReceived(event) {

    let pushNotification;
    try {
        pushNotification = event.data.json(); // this will be a Models.PushNotification
    } catch (jsonError) {
        console.warn("Received push notification, but event.data.json() threw an error.", jsonError);
        return;
    }

    // Show the notification to the user.
    event.waitUntil(
        self.registration.showNotification(pushNotification.title || 'Chavah Messianic Radio', {
            body: pushNotification.body,
            icon: pushNotification.iconUrl || '/images/chavah120x120.png',
            image: pushNotification.imageUrl, // The big image to show. In Chrome, this shows on the top of hte notification, unscaled and clipped to the window
            data: pushNotification.clickUrl,
            badge: '/images/chavah48x48.png',
            requireInteraction: true,
            actions: [
                {
                    action: 'read',
                    title: 'Read more...'
                }
            ]
        })
    );

    // Update the app badge.
    if (pushNotification.unreadCount && navigator.setAppBadge) {
        navigator.setAppBadge(pushNotification.unreadCount);
    }
}

/**
 * Performs the notification click logic.
 * @param {Event} event
 */
function onNotificationClick(event) {
    const url = event && event.notification ? event.notification.data : "";
    event.notification.close();

    if (url) {
        event.waitUntil(self.clients.openWindow(url));
    }
}

/**
 * Fetches the unread count for the user.
 * @param {PeriodicSyncEvent} event
 */
async function onPeriodicSync(event) {
    console.info("Periodic background sync triggered", event);
    if (event.tag === unreadCountBackgroundSync) {
        try {
            const unreadCountResult = await fetch("/api/users/getUnreadNotificationsCount");
            if (!unreadCountResult.ok) {
                console.warn("Periodic sync of unread notification count failed", unreadCountResult);
                return;
            }

            const unreadCountText = await unreadCountResult.text();
            navigator.setAppBadge(parseInt(unreadCountText));
            console.info("Successfully fetched unread count via periodic sync", unreadCountText);
        } catch (fetchError) {
            console.warn("Unable to fetch unread count in periodic sync due to error", fetchError);
        }
    }
}

/**
 * Checks whether the resource is a media resource (MP3, JPG, etc) on our CDN.
 * @param {string} url The URL to check.
 * @returns {boolean}
 */
function isMediaUrl(url) {
    return url && url.match(/b-cdn.net/ig);
}

/**
 * Checks whether the request is for a CDN resource.
 * @param {string} url The URL to check.
 * @returns {boolean}
 */
function isCdnUrl(url) {
    return url && (url.match(/b-cdn.net/ig) ||
        url.match(/cdnjs.cloudflare.com/ig) ||
        url.match(/cdn.jsdelivr.net/ig) ||
        url.match(/ajax.googleapis.com/ig) ||
        url.match(/fonts.googleapis.com/ig) ||
        url.match(/maxcdn.bootstrapcdn.com/ig) ||
        url.match(/code.jquery.com/ig));
}

/**
 * Converts megabytes into bytes.
 * @param {number} mb
 * @returns {number}
 */
function megaBytesInBytes(mb) {
    return mb * 1048576;
}

self.addEventListener("install", e => onInstall(e));
self.addEventListener("fetch", e => onFetch(e));
self.addEventListener("push", e => onPushNotificationReceived(e));
self.addEventListener("notificationclick", e => onNotificationClick(e));
self.addEventListener("periodicsync", e => onPeriodicSync(e));
