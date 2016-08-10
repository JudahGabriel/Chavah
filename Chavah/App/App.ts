namespace BitShuva.Chavah {
    "use strict";

    var modules = [
        "ngRoute",
        "ngTouch",
        "ui.bootstrap",
        "ui.bootstrap.tpls"
    ];

    export var App = angular.module("ChavahApp", modules);
    
    App.config(["$routeProvider", ($routeProvider: ng.route.IRouteProvider) => {
        $routeProvider
            .when("/nowplaying", {
                templateUrl: "App/Views/NowPlaying.html",
                controller: "NowPlayingController as vm",
                caseInsensitiveMatch: true
            }).when("/admin/albums/upload", {
                templateUrl: "App/Views/UploadAlbum.html",
                caseInsensitiveMatch: true
            }).when("/trending", {
                templateUrl: "App/Views/Trending.html",
                controller: "TrendingController as vm",
                caseInsensitiveMatch: true
            }).otherwise({
                redirectTo: "/nowplaying"
            });
    }]);
}
  