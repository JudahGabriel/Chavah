import {
  pageCache,
  imageCache,
  staticResourceCache,
  offlineFallback,
} from 'workbox-recipes';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { RouteMatchCallbackOptions } from 'workbox-core';

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/**
 * Determines whether the specified route is an Messianic Chords API call and whether it matches the list of cacheable routes.
 * @param {RouteMatchCallbackOptions} e Route match details
 * @param {string[]} cacheableRoutes A list of routes that should match.
 * @returns Whether the route is a cachable API route.
 */
function isCachableApiRoute(e, cacheableRoutes) {
  const host = e.url.host?.toLowerCase() || "";
  const isApiRoute = host === "api.messianicchords.com";
  const relativePath = e.url.pathname.toLowerCase();
  return isApiRoute && cacheableRoutes.some(apiUrl => relativePath === apiUrl);
}

try {
  //@ts-ignore
  const filesToCacheManifest = self.__WB_MANIFEST; // array of {revision: string, url: string}
  precacheAndRoute(filesToCacheManifest);
}
catch (err) {
  console.info("if you are in development mode this error is expected: ", err);
}

// Page cache recipe: https://developers.google.com/web/tools/workbox/modules/workbox-recipes#page_cache
// This is a network-first stragety for HTML pages. If the page doesn't respond in 3 seconds, it falls back to cache.
pageCache({
  networkTimeoutSeconds: 3,
  warmCache: [
    "/",
    "/browse/newest",
    "/browse/songs",
    "/browse/artists",
    "/artist/_",
    "/ChordSheets/_"
  ],
  plugins: [{
      // We want to override cache key for
      //  - Artist page: /artist/Joe%20Artist
      //  - Chord details page: /ChordSheets/2630
      // Reason is, these pages are the same HTML, just different behavior.
      cacheKeyWillBeUsed: async function({request}) {
        const isArtistPage = !!request.url.match(/\/artist\/[^\/]+$/);
        if (isArtistPage) {
          return new URL(request.url).origin + "/artist/_";
        }
        const chordDetailsRegex = new RegExp(/\/ChordSheets\/[\w|\d|-]+$/, "i");
        const isChordDetailsPage = !!request.url.match(chordDetailsRegex);
        if (isChordDetailsPage) {
          return new URL(request.url).origin + "/ChordSheets/_"
        }

        return request.url;
      }
    }]
});

// Static resource recipe: https://developers.google.com/web/tools/workbox/modules/workbox-recipes#static_resources_cache
// This is a stale-while-revalidate strategy for CSS, JS, and web workers.
// By default, this recipe matches styles, scripts, and workers.
// We override matchCallback to also include fonts and our JSON strings
const staticResourceDestinations = [
  "style",
  "script",
  "worker",
  "font",
  "media"
]
staticResourceCache({
  matchCallback: e => staticResourceDestinations.some(dest => dest === e.request.destination) || e.url?.href.endsWith("dice.mp3"),
  warmCache: ["/assets/audio/dice.mp3"]
});

// Image cache recipe: https://developers.google.com/web/tools/workbox/modules/workbox-recipes#image_cache
// This is a cache-first strategy for all images. We specify a max number of images and max age of image.
imageCache({
  maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days: 60 seconds * 60 minutes in an hour * 24 hours in a day * 14 days
  maxEntries: 5000
});

// For our API calls to fetch apps, we use StaleWhileRevalidate strategy.
// This strategy loads from the cache first for fast UI updates. Meanwhile,
// we do a network request in the background to refresh the cache.
// These cache results remain valid for a short period of time before we invalidate them.
const staleWhileRevalidateRoutes = [
  "/chords/getbysongname", // chords by song name
  "/chords/getallartists", // list of all artists
  "/chords/getbyartistname", // list of artists sorted by name
  "/chords/search", // searches
];
registerRoute(
  e => isCachableApiRoute(e, staleWhileRevalidateRoutes),
  new StaleWhileRevalidate({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 5000,
        maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days. OK to cache these longer as we have a StaleWhileRevalidate, meaning we show results from cache instantly while refreshing cache in background.
      })
    ]
  })
)

// API calls that should be network first, with fallback to cache
const networkFirstRoutes = [
  "/chords/getnew", // fetching new chord sheets
  "/chords/get", // Getting a specific chord sheet
];
registerRoute(
  e => isCachableApiRoute(e, networkFirstRoutes),
  new NetworkFirst({
    cacheName: "api-cache-network-first",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
)

// Offline page recipe https://developers.google.com/web/tools/workbox/modules/workbox-recipes#offline_fallback
offlineFallback();