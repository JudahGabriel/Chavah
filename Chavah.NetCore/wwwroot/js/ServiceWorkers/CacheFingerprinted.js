self.addEventListener('push', function (event) {
    var pushNotification = event.data.json(); // this will be a Models.PushNotification

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
});

self.onnotificationclick = function (event) {
    var url = event && event.notification ? event.notification.data : "";
    event.notification.close();

    if (url) {
        event.waitUntil(clients.openWindow(url));
    }
};

(function () {
    'use strict';

    // Cache Fingerprinted caches all resources that have a fingerprint (that is, a ?v=123" query string) on them.
    // Fingerprinted resources will bypass the network and be served from the cache.

    // Update 'version' if you need to refresh the cache
    var version = "v1.0::CacheFingerprinted";
    var offlineUrl = "/views/offline.html";

    // Store core files in a cache (including a page to display when offline)
    function updateStaticCache() {
        return caches.open(version)
            .then(function (cache) {
                return cache.addAll([
                    offlineUrl
                ]);
            });
    }

    function addToCache(request, response) {
        if (!response.ok)
            return;

        var copy = response.clone();
        caches.open(version)
            .then(function (cache) {
                cache.put(request, copy);
            });
    }

    function serveOfflineImage(request) {
        if (request.headers.get('Accept').indexOf('image') !== -1) {
            return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
        }
    }

    self.addEventListener('install', function (event) {
        event.waitUntil(updateStaticCache());
    });

    self.addEventListener('activate', function (event) {
        event.waitUntil(
            caches.keys()
                .then(function (keys) {
                    // Remove caches whose name is no longer valid
                    return Promise.all(keys
                        .filter(function (key) {
                            return key.indexOf(version) !== 0;
                        })
                        .map(function (key) {
                            return caches.delete(key);
                        })
                    );
                })
        );
    });

    self.addEventListener('fetch', function (event) {
        var request = event.request;

        // Always fetch non-GET requests from the network
        if (request.method !== 'GET' || request.url.match(/\/browserLink/ig)) {
            event.respondWith(
                fetch(request)
                    .catch(function () {
                        return caches.match(offlineUrl);
                    })
            );
            return;
        }
        
        // cache first for fingerprinted resources
        if (request.url.match(/(\?|&)v=/ig)) {
            event.respondWith(
                caches.match(request)
                    .then(function (response) {
                        return response || fetch(request)
                            .then(function (response) {
                                addToCache(request, response);
                                return response || serveOfflineImage(request);
                            })
                            .catch(function () {
                                return serveOfflineImage(request);
                            });
                    })
            );

            return;
        }

        // network first for non-fingerprinted resources
        event.respondWith(
            fetch(request)
                .catch(function () {
                    return caches.match(request)
                        .then(function (response) {
                            return response || serveOfflineImage(request);
                        })
                        .catch(function () {
                            return serveOfflineImage(request);
                        });
                })
        );
    });

})();