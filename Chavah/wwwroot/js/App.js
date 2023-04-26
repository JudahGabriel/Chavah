var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        "use strict";
        var modules = [
            "ngRoute",
            "ngAnimate",
            "ui.bootstrap",
            "ui.bootstrap.tpls",
            "LocalStorageModule",
        ];
        Chavah.App = angular.module("ChavahApp", modules);
        var homeVm = window["BitShuva.Chavah.HomeViewModel"];
        Chavah.App.constant("homeViewModel", homeVm);
        Chavah.App.constant("initialUser", homeVm.user);
        // Gets the relative path to a cache-busted angular view.
        // The view URL is appended a hash of the contents of the file. See AngularCacheBustedViewsProvider.cs
        function findCacheBustedView(viewName) {
            var cacheBustedView = homeVm.cacheBustedAngularViews.find(function (v) { return v.search(new RegExp(viewName, "i")) !== -1; });
            if (!cacheBustedView) {
                throw new Error("Unable to find cache-busted Angular view " + viewName);
            }
            return cacheBustedView;
        }
        Chavah.FindAppView = findCacheBustedView;
        function createRoute(templateUrl, access) {
            if (access === void 0) { access = Chavah.RouteAccess.Anonymous; }
            var cacheBustedView = findCacheBustedView(templateUrl);
            return {
                templateUrl: cacheBustedView,
                access: access,
            };
        }
        var templatePaths = {
            artistList: findCacheBustedView("/partials/ArtistList.html"),
            songRequestModal: findCacheBustedView("/modals/RequestSongModal.html"),
            confirmDeleteSongModal: findCacheBustedView("/modals/ConfirmDeleteSongModal.html"),
            songRequestResult: findCacheBustedView("/partials/SongRequestResult.html"),
            headerPartial: findCacheBustedView("/partials/Header.html"),
            footerPartial: findCacheBustedView("/partials/Footer.html"),
            adminSidebar: findCacheBustedView("/partials/AdminSidebar.html"),
            cropImageModal: findCacheBustedView("/modals/CropImageModal.html"),
            pushSubscriptionSuccessful: findCacheBustedView("/modals/PushSubscriptionSuccessful.html"),
            errorPlayingAudioModal: findCacheBustedView("/modals/ErrorPlayingAudioModal.html")
        };
        Chavah.App.constant("templatePaths", templatePaths);
        Chavah.App.config(["$routeProvider", "$locationProvider", "$compileProvider", function ($routeProvider, $locationProvider, $compileProvider) {
                $routeProvider.caseInsensitiveMatch = true;
                $locationProvider.hashPrefix("");
                $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|sms|javascript):/);
                $compileProvider.debugInfoEnabled(homeVm.debug);
                $routeProvider
                    .when("/", createRoute("/NowPlaying.html"))
                    .when("/nowplaying", { redirectTo: "/" })
                    .when("/trending", createRoute("/Trending.html"))
                    .when("/profile", createRoute("/Profile.html", Chavah.RouteAccess.Authenticated))
                    .when("/popular", createRoute("/Popular.html"))
                    .when("/recent", createRoute("/Recent.html"))
                    .when("/mylikes", createRoute("/MyLikes.html", Chavah.RouteAccess.Authenticated))
                    .when("/edit/songs/:id", createRoute("/EditSong.html", Chavah.RouteAccess.Authenticated))
                    .when("/sharethanks/:artist?", createRoute("/ShareThanks.html"))
                    .when("/about", createRoute("/Legal.html"))
                    .when("/welcome", createRoute("/Welcome.html"))
                    .when("/songeditapproved/:artist/:songName", createRoute("/SongEditApproved.html"))
                    .when("/privacy", createRoute("/PrivacyPolicy.html"))
                    .when("/support", createRoute("/Support.html"))
                    .when("/maintenance", createRoute("/Maintenance.html"))
                    // Sign in
                    .when("/promptsignin", createRoute("/PromptSignIn.html"))
                    .when("/signin", createRoute("/SignIn.html"))
                    .when("/password/:email", createRoute("/Password.html"))
                    .when("/forgotpassword/:email?/:pwned?", createRoute("/ForgotPassword.html"))
                    .when("/createpassword/:email", createRoute("/CreatePassword.html"))
                    .when("/register/:email?", createRoute("/Register.html"))
                    .when("/confirmemail/:email/:confirmCode", createRoute("/ConfirmEmail.html"))
                    .when("/resetpassword/:email/:confirmCode", createRoute("/ResetPassword.html"))
                    // Donate
                    .when("/donate/:artist?", createRoute("/Donate.html"))
                    .when("/donatesuccess", createRoute("/DonateSuccess.html"))
                    .when("/donatecancelled", createRoute("/DonateCancelled.html"))
                    // Admin
                    .when("/admin", createRoute("/EditSongs.html", Chavah.RouteAccess.Admin))
                    .when("/admin/albums", createRoute("/Albums.html", Chavah.RouteAccess.Admin))
                    .when("/admin/album/upload", createRoute("/UploadAlbum.html", Chavah.RouteAccess.Admin))
                    .when("/admin/album/create", createRoute("/EditAlbum.html", Chavah.RouteAccess.Admin))
                    .when("/admin/album/:artist/:album", createRoute("/EditAlbum.html", Chavah.RouteAccess.Admin))
                    .when("/admin/artists/:artistName?", createRoute("/EditArtist.html", Chavah.RouteAccess.Admin))
                    .when("/admin/songedits", createRoute("/ApproveSongEdits.html", Chavah.RouteAccess.Admin))
                    .when("/admin/tags", createRoute("/TagEditor.html", Chavah.RouteAccess.Admin))
                    .when("/admin/logs", createRoute("/LogEditor.html", Chavah.RouteAccess.Admin))
                    .when("/admin/songs", { redirectTo: "/admin" })
                    .when("/admin/donations", createRoute("/AdminDonations.html", Chavah.RouteAccess.Admin))
                    .when("/admin/users", createRoute("/AdminUsers.html", Chavah.RouteAccess.Admin))
                    .otherwise({
                    redirectTo: "/nowplaying",
                });
                if (homeVm.isDownForMaintenance) {
                    $routeProvider.when("/", { redirectTo: "/maintenance" });
                }
            }]);
        Chavah.App.run([
            "templatePaths",
            "accountApi",
            "appNav",
            "adminScripts",
            "navigatorMediaSession",
            "uwpNativeAudio",
            "iOSMediaSession",
            "$rootScope",
            "$location",
            "$window",
            "$q",
            // tslint:disable-next-line:no-shadowed-variable
            function (templatePaths, accountApi, appNav, adminScripts, navigatorMediaSession, uwpNativeAudio, iOSMediaSession, $rootScope, $location, $window, $q) {
                // Use Angular's Q object as Promise. This is needed to make async/await work properly with the UI.
                // See http://stackoverflow.com/a/41825004/536
                $window["Promise"] = $q;
                // Integrate with the host platform's audio services, e.g. lockscreen media buttons, "currently playing" media info panels, etc.
                iOSMediaSession.install(); // iOS
                navigatorMediaSession.install(); // Android, emerging web standard
                uwpNativeAudio.install(); // Windows
                // Attach the view-busted template paths to the root scope so that we can bind to the names in our views.
                $rootScope.Partials = templatePaths;
                // Hide the splash UI.
                $(".splash").remove();
                $rootScope.$on("$routeChangeSuccess", function (e, next) {
                    // Let Google Analytics know about our route change.
                    var ga = window.ga;
                    if (ga) {
                        ga("send", "pageview", $location.path());
                    }
                });
                // tslint:disable-next-line:variable-name
                $rootScope.$on("$routeChangeStart", function (_e, next) {
                    var route = next.$$route;
                    // One of our app routes?
                    if (route && route.access !== undefined) {
                        // Redirect to sign in if needed.
                        var needsToSignIn = !accountApi.isSignedIn && route.access !== Chavah.RouteAccess.Anonymous;
                        var needsAdminSignIn = route.access === Chavah.RouteAccess.Admin && accountApi.currentUser && !accountApi.currentUser.isAdmin;
                        if (needsToSignIn || needsAdminSignIn) {
                            appNav.signIn();
                            return;
                        }
                        // If we're an admin route, load the admin-specific scripts.
                        if (route.access === Chavah.RouteAccess.Admin) {
                            adminScripts.install();
                        }
                    }
                });
            }
        ]);
        // Setup Fastclick to remove the 300ms click delay on mobile browsers.
        document.addEventListener("DOMContentLoaded", function () { return FastClick.attach(document.body); }, false);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=App.js.map