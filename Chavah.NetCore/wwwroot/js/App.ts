namespace BitShuva.Chavah {
    "use strict";
    const modules = [
        "ngRoute",
        "ngAnimate",
        "ui.bootstrap",
        "ui.bootstrap.tpls",
        "LocalStorageModule",
    ];

    export const App = angular.module("ChavahApp", modules);

    const homeVm: Server.HomeViewModel = window["BitShuva.Chavah.HomeViewModel"];
    App.constant("homeViewModel", homeVm);
    App.constant("initialUser", homeVm.user);

    // Gets the relative path to a cache-busted angular view.
    // The view URL is appended a hash of the contents of the file. See AngularCacheBustedViewsProvider.cs
    function findCacheBustedView(viewName: string) {
        let cacheBustedView = homeVm.cacheBustedAngularViews.find((v) => v.search(new RegExp(viewName, "i")) !== -1);
        if (!cacheBustedView) {
            throw new Error("Unable to find cache-busted Angular view " + viewName);
        }

        return cacheBustedView;
    }
    export const FindAppView = findCacheBustedView;

    function createRoute(templateUrl: string, access = RouteAccess.Anonymous): AppRoute {
        let cacheBustedView = findCacheBustedView(templateUrl);
        return {
            templateUrl: cacheBustedView,
            access,
        };
    }

    const templatePaths: ITemplatePaths = {
        artistList: findCacheBustedView("/partials/ArtistList.html"),
        songRequestModal: findCacheBustedView("/modals/RequestSongModal.html"),
        confirmDeleteSongModal: findCacheBustedView("/modals/ConfirmDeleteSongModal.html"),
        songRequestResult: findCacheBustedView("/partials/SongRequestResult.html"),
        headerPartial: findCacheBustedView("/partials/Header.html"),
        footerPartial: findCacheBustedView("/partials/Footer.html"),
        adminSidebar: findCacheBustedView("/partials/AdminSidebar.html"),
        goBack: findCacheBustedView("/partials/GoBack.html"),
        cropImageModal: findCacheBustedView("/modals/CropImageModal.html"),
        pushSubscriptionSuccessful: findCacheBustedView("/modals/PushSubscriptionSuccessful.html"),
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
        privacyPolicy: "/PrivacyPolicy.html",
        support: "/Support.html",
        maintenance: "/Maintenance.html",

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
        logs: "/LogEditor.html",
        editSongs: "/EditSongs.html"
    };

    App.config(["$routeProvider", "$locationProvider", "$compileProvider",
        (
            $routeProvider: ng.route.IRouteProvider, $locationProvider: ng.ILocationProvider, $compileProvider: ng.ICompileProvider) => {
            $routeProvider.caseInsensitiveMatch = true;
            $locationProvider.hashPrefix("");
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|sms|javascript):/);
            $compileProvider.debugInfoEnabled(homeVm.debug);

            $routeProvider
                .when("/", createRoute("NowPlaying.html"))
                .when("/nowplaying", { redirectTo: "/" })
                .when("/trending", createRoute("Trending.html"))
                .when("/profile", createRoute(views.profile, RouteAccess.Authenticated))
                .when("/popular", createRoute(views.popular))
                .when("/recent", createRoute(views.recent))
                .when("/mylikes", createRoute(views.myLikes, RouteAccess.Authenticated))
                .when("/edit/songs/:id", createRoute(views.editSong, RouteAccess.Authenticated))
                .when("/sharethanks/:artist?", createRoute(views.shareThanks))
                .when("/about", createRoute(views.about))
                .when("/welcome", createRoute(views.welcome))
                .when("/songeditapproved/:artist/:songName", createRoute(views.songEditApproved))
                .when("/privacy", createRoute(views.privacyPolicy))
                .when("/support", createRoute(views.support))
                .when("/maintenance", createRoute(views.maintenance))

                // Sign in
                .when("/promptsignin", createRoute(views.promptSignIn))
                .when("/signin", createRoute(views.signIn))
                .when("/password/:email", createRoute(views.password))
                .when("/forgotpassword/:email?/:pwned?", createRoute(views.forgotPassword))
                .when("/createpassword/:email", createRoute(views.createPassword))
                .when("/register/:email?", createRoute(views.register))
                .when("/confirmemail/:email/:confirmCode", createRoute(views.confirmEmail))
                .when("/resetpassword/:email/:confirmCode", createRoute(views.resetPassword))

                // Donate
                .when("/donate/:artist?", createRoute(views.donate))
                .when("/donatesuccess", createRoute(views.donateSuccess))
                .when("/donatecancelled", createRoute(views.donateCancelled))

                // Admin
                .when("/admin", createRoute(views.editSongs, RouteAccess.Admin))
                .when("/admin/albums", createRoute(views.albums, RouteAccess.Admin))
                .when("/admin/album/upload", createRoute(views.uploadAlbum, RouteAccess.Admin))
                .when("/admin/album/create", createRoute(views.createAlbum, RouteAccess.Admin))
                .when("/admin/album/:artist/:album", createRoute(views.editAlbum, RouteAccess.Admin))
                .when("/admin/artists/:artistName?", createRoute(views.editArtist, RouteAccess.Admin))
                .when("/admin/songedits", createRoute(views.songEdits, RouteAccess.Admin))
                .when("/admin/tags", createRoute(views.tags, RouteAccess.Admin))
                .when("/admin/logs", createRoute(views.logs, RouteAccess.Admin))
                .when("/admin/songs", createRoute(views.editSongs, RouteAccess.Admin)) 

                .otherwise({
                    redirectTo: "/nowplaying",
                });

            if (homeVm.isDownForMaintenance) {
                $routeProvider.when("/", { redirectTo: "/maintenance" });
            }
        }]);

    App.run([
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
        (templatePaths: ITemplatePaths,
            accountApi: AccountService,
            appNav: AppNavService,
            adminScripts: AdminScriptsService,
            navigatorMediaSession: NavigatorMediaSessionService,
            uwpNativeAudio: UwpNativeAudioService,
            iOSMediaSession: IOSMediaSessionService,
            $rootScope: ng.IRootScopeService,
            $location: ng.ILocationService,
            $window: ng.IWindowService,
            $q: ng.IQService) => {

            // Use Angular's Q object as Promise. This is needed to make async/await work properly with the UI.
            // See http://stackoverflow.com/a/41825004/536
            $window["Promise"] = $q;

            // Integrate with the host platform's audio services, e.g. lockscreen media buttons, "currently playing" media info panels, etc.
            iOSMediaSession.install(); // iOS
            navigatorMediaSession.install(); // Android, emerging web standard
            uwpNativeAudio.install(); // Windows

            // Attach the view-busted template paths to the root scope so that we can bind to the names in our views.
            ($rootScope as any).Partials = templatePaths;

            // Hide the splash UI.
            $(".splash").remove();

            $rootScope.$on("$routeChangeSuccess", (e: ng.IAngularEvent, next: any) => {
                // Let Google Analytics know about our route change.
                const ga = (window as any).ga;
                if (ga) {
                    ga("send", "pageview", $location.path());
                }
            });
            
            // tslint:disable-next-line:variable-name
            $rootScope.$on("$routeChangeStart", (_e: ng.IAngularEvent, next: any) => {
                const route: AppRoute = next.$$route;

                // One of our app routes?
                if (route && route.access !== undefined) {

                    // Redirect to sign in if needed.
                    const needsToSignIn = !accountApi.isSignedIn && route.access !== RouteAccess.Anonymous;
                    const needsAdminSignIn = route.access === RouteAccess.Admin && accountApi.currentUser && !accountApi.currentUser.isAdmin;
                    if (needsToSignIn || needsAdminSignIn) {
                        appNav.signIn();
                        return;
                    }

                    // If we're an admin route, load the admin-specific scripts.
                    if (route.access === RouteAccess.Admin) {
                        adminScripts.install();
                    }
                }
            });
        }]);

    // Setup Fastclick to remove the 300ms click delay on mobile browsers.
    document.addEventListener("DOMContentLoaded", () => FastClick.attach(document.body), false);
}
