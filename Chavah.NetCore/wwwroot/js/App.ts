namespace BitShuva.Chavah {
    "use strict";
     var modules = [
        "ngRoute",
        "ngAnimate",
        "ui.bootstrap",
        "ui.bootstrap.tpls",
        "LocalStorageModule"
    ];

    export const App = angular.module("ChavahApp", modules);

    const homeVm: Server.IHomeViewModel = window["BitShuva.Chavah.HomeViewModel"];
    App.constant("initConfig", homeVm); 

    // Gets the relative path to a cache-busted angular view. 
    // The view URL is appended a hash of the contents of the file. See AngularCacheBustedViewsProvider.cs
    function findCacheBustedView(viewName: string) {
        var cacheBustedView = homeVm.cacheBustedAngularViews.find(v => v.search(new RegExp(viewName, "i")) !== -1);
        if (!cacheBustedView) {
            throw new Error("Unable to find cache-busted Angular view " + viewName);
        }

        return cacheBustedView;
    } 
    export const FindAppView = findCacheBustedView;
    
    function createRoute(templateUrl: string, access = RouteAccess.Anonymous): Route {
        var cacheBustedView = findCacheBustedView(templateUrl);
        return {
            templateUrl: cacheBustedView,
            access: access,
        };
    }

    const templatePaths: TemplatePaths = {
        artistList: findCacheBustedView("/partials/ArtistList.html"),
        songList: findCacheBustedView("/partials/SongList.html"),
        songRequestModal: findCacheBustedView("/modals/RequestSongModal.html"),
        songRequestResult: findCacheBustedView("/partials/SongRequestResult.html"),
        headerPartial: findCacheBustedView("/partials/Header.html"),
        footerPartial: findCacheBustedView("/partials/Footer.html"),
        adminSidebar: findCacheBustedView("/partials/AdminSidebar.html"),
        goBack: findCacheBustedView("/partials/GoBack.html")
    };
    App.constant("templatePaths", templatePaths);
    
    const views = {
        nowPlaying: "/NowPlaying.html",
        trending: "/Trending.html",
        profile: "/Profile.html",
        popular: "/Popular.html",
        recent: "/RecentSongs.html",
        myLikes: "/MyLikes.html",
        editSong: "/EditSong.html",
        shareThanks: "/ShareThanks.html",
        about: "/Legal.html",
        welcome: "/Welcome.html",
        songEditApproved: "/SongEditApproved.html",

        // Sign in
        promptSignIn: "/PromptSignIn.html",
        signIn: "/SignIn.html",
        password: "/Password.html",
        forgotPassword: "/ForgotPassword.html",
        createPassword: "/CreatePassword.html",
        register: "/Register.html",
        confirmEmail: "/ConfirmEmail.html",
        resetPassword: "/ResetPassword.html",

        // Donate
        donate: "/Donate.html",
        donateSuccess: "/DonateSuccess.html",
        donateCancelled: "/DonateCancelled.html",

        // Admin
        albums: "/Albums.html",
        uploadAlbum: "/UploadAlbum.html",
        createAlbum: "/EditAlbum.html",
        editAlbum: "/EditAlbum.html",
        editArtist: "/EditArtist.html",
        songEdits: "/ApproveSongEdits.html",
        tags: "/TagEditor.html",
        logs: "/LogEditor.html"
    };

    App.config(["$routeProvider", "$locationProvider", ($routeProvider: ng.route.IRouteProvider, $locationProvider: ng.ILocationProvider) => {
        $routeProvider.caseInsensitiveMatch = true;
        $locationProvider.hashPrefix('');
        $routeProvider
            .when("/", createRoute("NowPlaying.html"))
            .when("/nowplaying", { redirectTo: "/" })
            .when("/trending", createRoute("Trending.html"))
            .when("/profile", createRoute(views.profile))
            .when("/popular", createRoute(views.popular))
            .when("/recent", createRoute(views.recent))
            .when("/mylikes", createRoute(views.myLikes))
            .when("/edit/songs/:id", createRoute(views.editSong))
            .when("/sharethanks/:artist?", createRoute(views.shareThanks))
            .when("/about", createRoute(views.about))
            .when("/welcome", createRoute(views.welcome))
            .when("/songeditapproved/:artist/:songName", createRoute(views.songEditApproved))

            // Sign in
            .when("/promptsignin", createRoute(views.promptSignIn))
            .when("/signin", createRoute(views.signIn))
            .when("/password/:email", createRoute(views.password))
            .when("/forgotpassword", createRoute(views.forgotPassword))
            .when("/createpassword/:email", createRoute(views.createPassword))
            .when("/register/:email?", createRoute(views.register))
            .when("/confirmemail/:email/:confirmCode", createRoute(views.confirmEmail))
            .when("/resetpassword/:email/:confirmCode", createRoute(views.resetPassword))

            // Donate
            .when("/donate/:artist?", createRoute(views.donate))
            .when("/donatesuccess", createRoute(views.donateSuccess))
            .when("/donatecancelled", createRoute(views.donateCancelled))

            // Admin
            .when("/admin", createRoute(views.albums, RouteAccess.Admin))
            .when("/admin/albums", createRoute(views.albums, RouteAccess.Admin))
            .when("/admin/album/upload", createRoute(views.uploadAlbum, RouteAccess.Admin))
            .when("/admin/album/create", createRoute(views.createAlbum, RouteAccess.Admin))
            .when("/admin/album/:artist/:album", createRoute(views.editAlbum, RouteAccess.Admin))
            .when("/admin/artists/:artistName?", createRoute(views.editArtist, RouteAccess.Admin))
            .when("/admin/songedits", createRoute(views.songEdits, RouteAccess.Admin))
            .when("/admin/tags", createRoute(views.tags, RouteAccess.Admin))
            .when("/admin/logs", createRoute(views.logs, RouteAccess.Admin))

            .otherwise({
                redirectTo: "/nowplaying"
            });
    }]);

    App.run([
        "templatePaths",
        "accountApi",
        "appNav",
        "adminScripts",
        "$rootScope",
        "$location",
        "$q",
        (templatePaths: TemplatePaths,
        accountApi: AccountService,
        appNav: AppNavService,
        adminScripts: AdminScriptsService,
        $rootScope: ng.IRootScopeService,
        $location: ng.ILocationService,
        $q: ng.IQService) => {

            // Use Angular's Q object as Promise. This is needed to make async/await work properly with the UI.
            // See http://stackoverflow.com/a/41825004/536
            window["Promise"] = $q;

            // Attach the view-busted template paths to the root scope so that we can bind to the names in our views.
            $rootScope["Partials"] = templatePaths;

            // Hide the splash UI.
            $(".splash").remove();

            $rootScope.$on("$routeChangeSuccess", (e: ng.IAngularEvent, next: any) => {
                // Let Google Analytics know about our route change.
                var ga = window["ga"];
                if (ga) {
                    ga("send", "pageview", $location.path());
                }
            });

            $rootScope.$on("$routeChangeStart", (_e: ng.IAngularEvent, next: any) => {
                var route: AppRoute = next["$$route"];

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
        }]);

    // Setup Fastclick to remove the 300ms click delay on mobile browsers.
    document.addEventListener("DOMContentLoaded", () => FastClick.attach(document.body), false);
}
