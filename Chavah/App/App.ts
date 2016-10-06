namespace BitShuva.Chavah {
    "use strict";

    var modules = [
        "ngRoute",
        "ngAnimate",
        "ui.bootstrap",
        "ui.bootstrap.tpls",
    ];

    export var App = angular.module("ChavahApp", modules);

    function createRoute(htmlPage: string, isAdmin = false): AppRoute {
        return {
            templateUrl: htmlPage,
            isAdmin: isAdmin
        };
    }
    
    App.config(["$routeProvider", ($routeProvider: ng.route.IRouteProvider) => {
        $routeProvider.caseInsensitiveMatch = true;
        $routeProvider
            .when("/nowplaying", createRoute("/App/Views/NowPlaying.html"))
            .when("/trending", createRoute("/App/Views/Trending.html"))
            .when("/admin/albums/upload", createRoute("/App/Views/UploadAlbum.html", true))
            .when("/admin/artists/:artistName?", createRoute("/App/Views/EditArtist.html", true))
            .otherwise({
                redirectTo: "/nowplaying"
            });
    }]);

    // Setup Fastclick to remove the 300ms click delay on mobile browsers.
    document.addEventListener("DOMContentLoaded", () => FastClick.attach(document.body), false);
}
  