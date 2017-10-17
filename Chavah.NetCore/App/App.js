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
            "app-templates",
            "app-templates-main"
        ];
        Chavah.App = angular.module("ChavahApp", modules);
        function createRoute(htmlPage, isAdmin) {
            if (isAdmin === void 0) { isAdmin = false; }
            return {
                templateUrl: htmlPage,
                isAdmin: isAdmin
            };
        }
        var initConfig = window["BitShuva.Chavah.InitConfig"];
        Chavah.App.constant("initConfig", initConfig);
        var templatePaths = {
            artistList: "/App/Views/Templates/ArtistList.html",
            songList: "/App/Views/Templates/SongList.html",
            songRequestModal: "/App/Views/RequestSongModal.html",
            songRequestResult: "/App/Views/Templates/SongRequestResult.html",
            headerPartial: "/App/Views/Header.html",
            footerPartial: "/App/Views/Footer.html",
            adminSidebar: "/App/Views/Templates/AdminSidebar.html",
            goBack: "/App/Views/Templates/GoBack.html"
        };
        Chavah.App.constant("templatePaths", templatePaths);
        var views = {
            nowPlaying: "/App/Views/NowPlaying.html",
            trending: "/App/Views/Trending.html",
            profile: "/App/Views/Profile.html",
            popular: "/App/Views/Popular.html",
            recent: "/App/Views/RecentSongs.html",
            myLikes: "/App/Views/MyLikes.html",
            editSong: "/App/Views/EditSong.html",
            shareThanks: "/App/Views/ShareThanks.html",
            about: "/App/Views/Legal.html",
            welcome: "/App/Views/Welcome.html",
            songEditApproved: "/App/Views/SongEditApproved.html",
            // Sign in
            promptSignIn: "/App/Views/PromptSignIn.html",
            signIn: "/App/Views/SignIn.html",
            password: "/App/Views/Password.html",
            forgotPassword: "/App/Views/ForgotPassword.html",
            createPassword: "/App/Views/CreatePassword.html",
            register: "/App/Views/Register.html",
            confirmEmail: "/App/Views/ConfirmEmail.html",
            resetPassword: "/App/Views/ResetPassword.html",
            // Donate
            donate: "/App/Views/Donate.html",
            donateSuccess: "/App/Views/DonateSuccess.html",
            donateCancelled: "/App/Views/DonateCancelled.html",
            // Admin
            albums: "/App/Views/Albums.html",
            uploadAlbum: "/App/Views/UploadAlbum.html",
            createAlbum: "/App/Views/EditAlbum.html",
            editAlbum: "/App/Views/EditAlbum.html",
            editArtist: "/App/Views/EditArtist.html",
            songEdits: "/App/Views/ApproveSongEdits.html",
            tags: "/App/Views/TagEditor.html",
            logs: "/App/Views/LogEditor.html"
        };
        Chavah.App.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
                $routeProvider.caseInsensitiveMatch = true;
                $locationProvider.hashPrefix('');
                $routeProvider
                    .when("/", createRoute(views.nowPlaying))
                    .when("/nowplaying", createRoute(views.nowPlaying))
                    .when("/trending", createRoute(views.trending))
                    .when("/profile", createRoute(views.profile))
                    .when("/popular", createRoute(views.popular))
                    .when("/recent", createRoute(views.recent))
                    .when("/mylikes", createRoute(views.myLikes))
                    .when("/edit/songs/:id", createRoute(views.editSong))
                    .when("/sharethanks/:artist?", createRoute(views.shareThanks))
                    .when("/about", createRoute(views.about))
                    .when("/welcome", createRoute(views.welcome))
                    .when("/songeditapproved/:artist/:songName", createRoute(views.songEditApproved))
                    .when("/promptsignin", createRoute(views.promptSignIn))
                    .when("/signin", createRoute(views.signIn))
                    .when("/password/:email", createRoute(views.password))
                    .when("/forgotpassword", createRoute(views.forgotPassword))
                    .when("/createpassword/:email", createRoute(views.createPassword))
                    .when("/register/:email?", createRoute(views.register))
                    .when("/confirmemail/:email/:confirmCode", createRoute(views.confirmEmail))
                    .when("/resetpassword/:email/:confirmCode", createRoute(views.resetPassword))
                    .when("/donate/:artist?", createRoute(views.donate))
                    .when("/donatesuccess", createRoute(views.donateSuccess))
                    .when("/donatecancelled", createRoute(views.donateCancelled))
                    .when("/admin", createRoute(views.albums, true))
                    .when("/admin/albums", createRoute(views.albums, true))
                    .when("/admin/album/upload", createRoute(views.uploadAlbum, true))
                    .when("/admin/album/create", createRoute(views.createAlbum, true))
                    .when("/admin/album/:artist/:album", createRoute(views.editAlbum, true))
                    .when("/admin/artists/:artistName?", createRoute(views.editArtist, true))
                    .when("/admin/songedits", createRoute(views.songEdits, true))
                    .when("/admin/tags", createRoute(views.tags, true))
                    .when("/admin/logs", createRoute(views.logs, true))
                    .otherwise({
                    redirectTo: "/nowplaying"
                });
            }]);
        Chavah.App.run([
            "templates-main",
            "templatePaths",
            "accountApi",
            "appNav",
            "adminScripts",
            "$rootScope",
            "$location",
            "$q",
            function (templatePaths, accountApi, appNav, adminScripts, $rootScope, $location, $q) {
                // Use Angular's Q object as Promise. This is needed to make async/await work properly with the UI.
                // See http://stackoverflow.com/a/41825004/536
                window["Promise"] = $q;
                // Attach the view-busted template paths to the root scope so that we can bind to the names in our views.
                $rootScope["Partials"] = templatePaths;
                // Hide the splash UI.
                $(".splash").remove();
                $rootScope.$on("$routeChangeSuccess", function (e, next) {
                    // Let Google Analytics know about our route change.
                    var ga = window["ga"];
                    if (ga) {
                        ga("send", "pageview", $location.path());
                    }
                });
                $rootScope.$on("$routeChangeStart", function (_e, next) {
                    var route = next["$$route"];
                    // If we're an admin route, load the admin-specific scripts.
                    if (route && route.isAdmin) {
                        adminScripts.install();
                        // Also, cancel navigation if we're not an admin user and redirect to sign-in.
                        if (!accountApi.isSignedIn) {
                            appNav.signIn();
                        }
                    }
                });
                // Install our service worker if available.
                // We use it to cache our views so that the UI will always be available.
                // Commented out: Service Worker is so unstable, tools so immature. Come back in a few months and see if it's in better shape.
                //if ('serviceWorker' in navigator) {
                //    window.addEventListener("load", () => {
                //        console.log("zanz page loaded, registering service worker.");
                //        navigator["serviceWorker"].register("/ServiceWorker.js?test=4").then(
                //            registration => console.log("ServiceWorker registration successful with scope: ", registration.scope),
                //            err => console.log("ServiceWorker registration failed: ", err)
                //        );
                //    });
                //}
            }
        ]);
        // Setup Fastclick to remove the 300ms click delay on mobile browsers.
        document.addEventListener("DOMContentLoaded", function () { return FastClick.attach(document.body); }, false);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
