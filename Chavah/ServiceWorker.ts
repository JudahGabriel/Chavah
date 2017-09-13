// TODO: this is not yet implemented, nor registered in App.ts
// Service Worker standard is still in flux, tools are still immature. Come back in a few months and see if it's worthwhile.
var viewCacheName = "views";
var views = [
    "/App/Views/NowPlaying.html"
];

self.addEventListener("install", function (event: any) {
    event.waitUntil(
        caches.open(viewCacheName).then(function (cache) {
            return cache.addAll(views);
        })
    );
});

self.addEventListener("fetch", function(event: any) {
    var req = event.request;
    if (event.request && event.request.url && event.request.url.indexOf("http://") === 0) {
        var httpsUrl = event.request.url.replace("http://", "https://");
        req = new Request(httpsUrl, event.request);
    }

    event.respondWith(
        caches.match(req).then(function(response) {
            return response || fetch(req);
        })
    );
});