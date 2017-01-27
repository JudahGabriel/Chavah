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
        footerPartial: "/App/Views/Footer.html"
    };
    App.constant("templatePaths", templatePaths);

    App.config(["$routeProvider", ($routeProvider: ng.route.IRouteProvider) => {
        $routeProvider.caseInsensitiveMatch = true;
        $routeProvider
            .when("/nowplaying", createRoute("/App/Views/NowPlaying.html"))
            .when("/trending", createRoute("/App/Views/Trending.html"))
            .when("/profile", createRoute("/App/Views/Profile.html"))
            .when("/popular", createRoute("/App/Views/Popular.html"))
            .when("/recent", createRoute("/App/Views/RecentSongs.html"))
            .when("/mylikes", createRoute("/App/Views/MyLikes.html"))
            .when("/edit/songs/:id", createRoute("/App/Views/EditSong.html"))

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
            .when("/admin/albums/upload", createRoute("/App/Views/UploadAlbum.html", true))
            .when("/admin/albums/:id", createRoute("/App/Views/EditAlbum.html", true))
            .when("/admin/artists/:artistName?", createRoute("/App/Views/EditArtist.html", true))
            .when("/admin/songedits", createRoute("/App/views/ApproveSongEdits.html", true))

            .otherwise({
                redirectTo: "/nowplaying"
            });
    }]);

    App.run([
        "templatePaths", "accountApi", "appNav", "adminScripts", "$rootScope",
        (templatePaths: TemplatePaths, accountApi: AccountService, appNav: AppNavService, adminScripts: AdminScriptsService, $rootScope: ng.IRootScopeService) => {
        
        // Attach the view-busted template paths to the root scope so that we can bind to the names in our views.
        for (var prop in templatePaths) {
            $rootScope[prop] = templatePaths[prop];
        }

        // Hide the splash UI.
        $(".splash").remove();

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
  