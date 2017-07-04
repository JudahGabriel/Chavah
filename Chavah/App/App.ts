namespace BitShuva.Chavah {
    "use strict";

    var modules = [
        "ngRoute",
        "ngAnimate",
        "ui.bootstrap",
        "ui.bootstrap.tpls",
        "LocalStorageModule"
    ];

    export var App = angular.module("ChavahApp", modules);

    function createRoute(htmlPage: string, isAdmin = false): AppRoute {
        return {
            templateUrl: htmlPage,
            isAdmin: isAdmin
        };
    }
    
    var initConfig: InitConfig = window["BitShuva.Chavah.InitConfig"];
    App.constant("initConfig", initConfig);

    var templatePaths: TemplatePaths = {
        artistList: "/App/Views/Templates/ArtistList.html",
        songList: "/App/Views/Templates/SongList.html",
        songRequestModal: "/App/Views/RequestSongModal.html",
        songRequestResult: "/App/Views/Templates/SongRequestResult.html",
        headerPartial: "/App/Views/Header.html",
        footerPartial: "/App/Views/Footer.html",
        adminSidebar: "/App/Views/Templates/AdminSidebar.html",
        goBack: "/App/Views/Templates/GoBack.html"
    };
    App.constant("templatePaths", templatePaths);

    App.config(["$routeProvider", "$locationProvider", ($routeProvider: ng.route.IRouteProvider, $locationProvider: ng.ILocationProvider) => {
        $routeProvider.caseInsensitiveMatch = true;
        $locationProvider.hashPrefix('');
        $routeProvider
            .when("/nowplaying", createRoute("/App/Views/NowPlaying.html"))
            .when("/trending", createRoute("/App/Views/Trending.html"))
            .when("/profile", createRoute("/App/Views/Profile.html"))
            .when("/popular", createRoute("/App/Views/Popular.html"))
            .when("/recent", createRoute("/App/Views/RecentSongs.html"))
            .when("/mylikes", createRoute("/App/Views/MyLikes.html"))
            .when("/edit/songs/:id", createRoute("/App/Views/EditSong.html"))
            .when("/sharethanks/:artist?", createRoute("/App/Views/ShareThanks.html"))
            .when("/about", createRoute("/App/Views/Legal.html"))
            .when("/welcome", createRoute("/App/Views/Welcome.html"))
            .when("/songeditapproved/:artist/:songName", createRoute("/App/Views/SongEditApproved.html"))

            // Sign in
            .when("/promptsignin", createRoute("/App/Views/PromptSignIn.html"))
            .when("/signin", createRoute("/App/Views/SignIn.html"))
            .when("/password/:email", createRoute("/App/Views/Password.html"))
            .when("/forgotpassword", createRoute("/App/Views/ForgotPassword.html"))
            .when("/createpassword/:email", createRoute("/App/Views/CreatePassword.html"))
            .when("/register/:email?", createRoute("/App/Views/Register.html"))
            .when("/confirmemail/:email/:confirmCode", createRoute("/App/Views/ConfirmEmail.html"))
            .when("/resetpassword/:email/:confirmCode", createRoute("/App/Views/ResetPassword.html"))

            // Donate
            .when("/donate/:artist?", createRoute("/App/Views/Donate.html"))
            .when("/donatesuccess", createRoute("/App/Views/DonateSuccess.html"))
            .when("/donatecancelled", createRoute("/App/Views/DonateCancelled.html"))

            // Admin
            .when("/admin", createRoute("/App/Views/UploadAlbum.html", true))
            .when("/admin/album/upload", createRoute("/App/Views/UploadAlbum.html", true))
            .when("/admin/album/create", createRoute("/App/Views/EditAlbum.html", true))
            .when("/admin/album/:artist/:album", createRoute("/App/Views/EditAlbum.html", true))
            .when("/admin/artists/:artistName?", createRoute("/App/Views/EditArtist.html", true))
            .when("/admin/songedits", createRoute("/App/Views/ApproveSongEdits.html", true))
            .when("/admin/tags", createRoute("/App/Views/TagEditor.html", true))
            .when("/admin/logs", createRoute("/App/Views/LogEditor.html", true))

            .otherwise({
                redirectTo: "/nowplaying"
            });
    }]);

    App.run([
        "templatePaths", "accountApi", "appNav", "adminScripts", "$rootScope", "$location", "$q",
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

                    // Also, cancel navigation if we're not an admin user.
                    if (!accountApi.isSignedIn) {
                        appNav.nowPlaying();
                    }
                }
            });
        }]);

    // Setup Fastclick to remove the 300ms click delay on mobile browsers.
    document.addEventListener("DOMContentLoaded", () => FastClick.attach(document.body), false);
}
  