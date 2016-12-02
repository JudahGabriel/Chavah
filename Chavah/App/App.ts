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
        songRequestResult: "/App/Views/Templates/SongRequestResult.html"
    };
    App.constant("templatePaths", templatePaths);

    App.config(["$routeProvider", ($routeProvider: ng.route.IRouteProvider) => {
        $routeProvider.caseInsensitiveMatch = true;
        $routeProvider
            .when("/nowplaying", createRoute("/App/Views/NowPlaying.html"))
            .when("/trending", createRoute("/App/Views/Trending.html"))
            .when("/profile", createRoute("/App/Views/Profile.html"))
            .when("/submitsongedit/songs/:numberId", createRoute("/App/Views/SubmitSongEdit.html"))
            .when("/popular", createRoute("/App/Views/Popular.html"))
            .when("/recent", createRoute("/App/Views/RecentSongs.html"))
            .when("/mylikes", createRoute("/App/Views/MyLikes.html"))

            // Sign in
            .when("/signin", createRoute("/App/Views/SignIn.html"))
            .when("/password/:email", createRoute("/App/Views/Password.html"))
            .when("/forgotpassword", createRoute("/App/Views/ForgotPassword.html"))
            .when("/createpassword/:email", createRoute("/App/Views/CreatePassword.html"))
            .when("/register/:email?", createRoute("/App/Views/Register.html"))
            .when("/confirmemail/:email/:confirmCode", createRoute("/App/Views/ConfirmEmail.html"))
            .when("/resetpassword/:email/:confirmCode", createRoute("/App/Views/ResetPassword.html"))

            // Admin
            .when("/admin/albums/upload", createRoute("/App/Views/UploadAlbum.html", true))
            .when("/admin/albums/:id", createRoute("/App/Views/EditAlbum.html", true))
            .when("/admin/artists/:artistName?", createRoute("/App/Views/EditArtist.html", true))

            .otherwise({
                redirectTo: "/nowplaying"
            });
    }]);

    App.run(["templatePaths", "$rootScope", (templatePaths: TemplatePaths, $rootScope: ng.IRootScopeService) => {
        // Attach the view-busted template paths to the root scope so that we can bind to the names in our views.
        for (var prop in templatePaths) {
            $rootScope[prop] = templatePaths[prop];
        }
    }]);

    // Setup Fastclick to remove the 300ms click delay on mobile browsers.
    document.addEventListener("DOMContentLoaded", () => FastClick.attach(document.body), false);
}
  