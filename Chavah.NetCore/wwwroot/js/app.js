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
            "LocalStorageModule"
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
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AccountService = (function () {
            function AccountService(appNav, initConfig, httpApi, localStorageService) {
                this.appNav = appNav;
                this.initConfig = initConfig;
                this.httpApi = httpApi;
                this.localStorageService = localStorageService;
                this.signedIn = new Rx.BehaviorSubject(false);
                if (this.initConfig.userEmail) {
                    this.currentUser = new Chavah.User(this.initConfig.userEmail, this.initConfig.userRoles);
                    this.setAuthLocalStorage(this.initConfig.jwt);
                    this.signedIn.onNext(true);
                }
            }
            Object.defineProperty(AccountService.prototype, "hasSignedInOnThisDevice", {
                get: function () {
                    return this.localStorageService.get(AccountService.hasSignedInKey);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AccountService.prototype, "isSignedIn", {
                get: function () {
                    return !!this.currentUser;
                },
                enumerable: true,
                configurable: true
            });
            AccountService.prototype.signOut = function () {
                var _this = this;
                var signOutTask = this.httpApi.post("/api/Accounts/SignOut", null);
                signOutTask
                    .then(function () {
                    _this.currentUser = null;
                    _this.setAuthLocalStorage(null);
                    _this.signedIn.onNext(false);
                });
                return signOutTask;
            };
            AccountService.prototype.clearNotifications = function () {
                return this.httpApi.post("/api/accounts/clearNotifications", null);
            };
            AccountService.prototype.register = function (email, password) {
                var escapedEmail = encodeURIComponent(email);
                var escapedPassword = encodeURIComponent(password);
                return this.httpApi.post("/api/Accounts/Register?email=" + escapedEmail + "&password=" + escapedPassword, null);
            };
            AccountService.prototype.getUserWithEmail = function (email) {
                var args = {
                    email: email
                };
                return this.httpApi.query("/api/Accounts/GetUserWithEmail", args);
            };
            AccountService.prototype.createPassword = function (email, password) {
                var emailEscaped = encodeURIComponent(email);
                var passwordEscaped = encodeURIComponent(password);
                return this.httpApi.post("/api/Accounts/CreatePassword?email=" + emailEscaped + "&password=" + passwordEscaped, null);
            };
            AccountService.prototype.signIn = function (email, password, staySignedIn) {
                var _this = this;
                var emailEscaped = encodeURIComponent(email);
                var passwordEscaped = encodeURIComponent(password);
                var signInTask = this.httpApi.post("/api/Accounts/SignIn?email=" + emailEscaped + "&password=" + passwordEscaped + "&staySignedIn=" + staySignedIn, null);
                signInTask.then(function (result) {
                    if (result.status === Chavah.SignInStatus.Success) {
                        _this.setAuthLocalStorage(result.jsonWebToken);
                        _this.currentUser = new Chavah.User(result.email, result.roles);
                        _this.signedIn.onNext(true);
                        // If we have Google Analytics, notify about the signed in user.
                        var ga = window["ga"];
                        if (ga) {
                            ga("set", "userId", result.email);
                        }
                    }
                    else {
                        _this.setAuthLocalStorage(result.jsonWebToken);
                        _this.currentUser = null;
                        _this.signedIn.onNext(false);
                    }
                });
                return signInTask;
            };
            AccountService.prototype.confirmEmail = function (email, confirmCode) {
                var escapedEmail = encodeURIComponent(email);
                var escapedConfirmCode = encodeURIComponent(confirmCode);
                return this.httpApi.post("/api/Accounts/ConfirmEmail?email=" + escapedEmail + "&confirmCode=" + escapedConfirmCode, null);
            };
            AccountService.prototype.sendPasswordResetEmail = function (email) {
                return this.httpApi.post("/api/Accounts/SendResetPasswordEmail?email=" + encodeURIComponent(email), null);
            };
            AccountService.prototype.resetPassword = function (email, passwordResetCode, newPassword) {
                var escapedEmail = encodeURIComponent(email);
                var escapedPasswordResetCode = encodeURIComponent(passwordResetCode);
                var escapedNewPassword = encodeURIComponent(newPassword);
                return this.httpApi.post("/api/Accounts/ResetPassword?email=" + escapedEmail + "&passwordResetCode=" + escapedPasswordResetCode + "&newPassword=" + escapedNewPassword, null);
            };
            AccountService.prototype.setAuthLocalStorage = function (jwt) {
                this.localStorageService.set(AccountService.jwtKey, jwt);
                if (jwt) {
                    this.localStorageService.set(AccountService.hasSignedInKey, true);
                }
            };
            return AccountService;
        }());
        AccountService.hasSignedInKey = "hasSignedInSuccessfully";
        AccountService.jwtKey = "jwt";
        AccountService.$inject = [
            "appNav",
            "initConfig",
            "httpApi",
            "localStorageService"
        ];
        Chavah.AccountService = AccountService;
        Chavah.App.service("accountApi", AccountService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Service that adds admin-specific scripts to the document if not already added.
         */
        var AdminScriptsService = (function () {
            function AdminScriptsService() {
                this.hasInstalled = false;
            }
            AdminScriptsService.prototype.install = function () {
                if (!this.hasInstalled) {
                    this.hasInstalled = true;
                    var adminScripts = [
                        "https://api.filepicker.io/v1/filepicker.js",
                        "https://cdnjs.cloudflare.com/ajax/libs/vibrant.js/1.0.0/Vibrant.min.js"
                    ];
                    adminScripts.forEach(function (s) {
                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src = s;
                        document.body.appendChild(script);
                    });
                }
            };
            return AdminScriptsService;
        }());
        Chavah.AdminScriptsService = AdminScriptsService;
        Chavah.App.service("adminScripts", AdminScriptsService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AlbumApiService = (function () {
            function AlbumApiService(httpApi, $q) {
                this.httpApi = httpApi;
                this.$q = $q;
            }
            /**
             * Uploads a new album. Returns a promise containing the ID of the new album.
             */
            AlbumApiService.prototype.upload = function (album) {
                return this.httpApi.post("/api/albums/upload", album);
            };
            AlbumApiService.prototype.changeArt = function (albumId, artUri) {
                var args = {
                    albumId: albumId,
                    artUri: artUri
                };
                return this.httpApi.postUriEncoded("/api/albums/changeArt", args, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.get = function (id) {
                var args = {
                    id: id
                };
                return this.httpApi.query("/api/albums/get", args, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.getAll = function (skip, take, search) {
                var args = {
                    skip: skip,
                    take: take,
                    search: search
                };
                return this.httpApi.query("/api/albums/getAll", args, AlbumApiService.albumPagedListSelector);
            };
            AlbumApiService.prototype.getByArtistAndAlbumName = function (artist, album) {
                var args = {
                    artist: artist,
                    album: album
                };
                return this.httpApi.query("/api/albums/getByArtistAlbum", args, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.save = function (album) {
                return this.httpApi.post("/api/albums/save", album, AlbumApiService.albumSelector);
            };
            AlbumApiService.prototype.getAlbums = function (albumIds) {
                var args = {
                    albumIdsCsv: albumIds.join(",")
                };
                return this.httpApi.query("/api/albums/getAlbums", args, AlbumApiService.albumArraySelector);
            };
            //getAlbumsForSongs(songIds: string[]): ng.IPromise<Album[]> {
            //    var songIdsCsv = songIds.join(",");
            //    if (songIdsCsv.length === 0) {
            //        return this.$q.resolve<Album[]>([]);
            //    }
            //    var args = {
            //        songIdsCsv: songIdsCsv
            //    };
            //    return this.httpApi.query("/api/albums/GetAlbumsForSongs", args, AlbumApiService.albumArraySelector);
            //}
            AlbumApiService.prototype.deleteAlbum = function (albumId) {
                var args = {
                    albumId: albumId
                };
                return this.httpApi.postUriEncoded("/api/albums/delete", args);
            };
            AlbumApiService.albumSelector = function (serverObj) {
                if (serverObj) {
                    return new Chavah.Album(serverObj);
                }
                return null;
            };
            AlbumApiService.albumArraySelector = function (serverObjs) {
                return serverObjs.map(function (s) { return AlbumApiService.albumSelector(s); });
            };
            AlbumApiService.albumPagedListSelector = function (serverObj) {
                return {
                    items: AlbumApiService.albumArraySelector(serverObj.items),
                    skip: serverObj.skip,
                    take: serverObj.take,
                    total: serverObj.total
                };
            };
            return AlbumApiService;
        }());
        AlbumApiService.$inject = [
            "httpApi",
            "$q"
        ];
        Chavah.AlbumApiService = AlbumApiService;
        Chavah.App.service("albumApi", AlbumApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * A cache of albums. Used to reduce traffic to the server when we need to fetch album colors for a particular song.
         */
        var AlbumCacheService = (function () {
            function AlbumCacheService(albumApi, $q) {
                this.albumApi = albumApi;
                this.$q = $q;
                this.cache = [];
            }
            AlbumCacheService.prototype.getAlbumsForSongs = function (songs) {
                var _this = this;
                if (!AlbumCacheService.hasAttemptedRehydratedCache) {
                    var rehydrated = AlbumCacheService.tryRehydrateCache();
                    if (rehydrated) {
                        this.cache = rehydrated;
                    }
                }
                var albumIdCacheMisses = [];
                var albumsForSongs = [];
                var albumIdsToFetch = _.uniq(songs
                    .filter(function (s) { return !!s.albumId; })
                    .map(function (s) { return s.albumId; }));
                albumIdsToFetch.forEach(function (albumId) {
                    // Do we have it in the cache? 
                    var cachedAlbum = _this.getCachedAlbum(albumId);
                    if (cachedAlbum) {
                        albumsForSongs.push(cachedAlbum);
                    }
                    else {
                        albumIdCacheMisses.push(albumId);
                    }
                });
                // If everthing's in the cache, just return that.            
                var allInCache = albumIdCacheMisses.length === 0;
                if (allInCache) {
                    return this.$q.resolve(albumsForSongs);
                }
                // At least some songs need their album fetched.
                var deferredResult = this.$q.defer();
                this.albumApi.getAlbums(_.uniq(albumIdCacheMisses))
                    .then(function (results) {
                    _this.addToCache(results);
                    deferredResult.resolve(albumsForSongs.concat(results));
                });
                return deferredResult.promise;
            };
            AlbumCacheService.prototype.getCachedAlbum = function (albumId) {
                var albumIdLowered = albumId.toLowerCase();
                return this.cache.find(function (album) { return album.id.toLowerCase() === albumIdLowered; });
            };
            AlbumCacheService.prototype.addToCache = function (albums) {
                var _this = this;
                var albumsNotInCache = albums.filter(function (a) { return !_this.cache.some(function (cached) { return cached.id === a.id; }); });
                (_a = this.cache).push.apply(_a, albumsNotInCache);
                AlbumCacheService.tryStoreCacheInLocalStorage(this.cache);
                var _a;
            };
            AlbumCacheService.tryStoreCacheInLocalStorage = function (cache) {
                try {
                    var data = JSON.stringify(cache);
                    localStorage.setItem(AlbumCacheService.cacheKey, data);
                }
                catch (error) {
                    console.log("Unable to save album cache to local storage.");
                }
            };
            AlbumCacheService.tryRehydrateCache = function () {
                AlbumCacheService.hasAttemptedRehydratedCache = true;
                try {
                    var cacheJson = localStorage.getItem(AlbumCacheService.cacheKey);
                    if (cacheJson) {
                        var rawCacheItems = JSON.parse(cacheJson);
                        if (rawCacheItems) {
                            return rawCacheItems.map(function (r) { return new Chavah.Album(r); });
                        }
                    }
                }
                catch (error) {
                    console.log("Unable to rehydrate album art cache.", error);
                }
                return null;
            };
            return AlbumCacheService;
        }());
        AlbumCacheService.cacheKey = "album-art-cache";
        AlbumCacheService.hasAttemptedRehydratedCache = false;
        AlbumCacheService.$inject = [
            "albumApi",
            "$q"
        ];
        Chavah.AlbumCacheService = AlbumCacheService;
        Chavah.App.service("albumCache", AlbumCacheService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AppNavService = (function () {
            function AppNavService(audioPlayer, templatePaths, $location, $uibModal) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.templatePaths = templatePaths;
                this.$location = $location;
                this.$uibModal = $uibModal;
                this.promptSignInUrl = "#/promptsignin";
                // Listen for when the song changes and update the document title.
                audioPlayer.song
                    .subscribe(function (song) { return _this.updateDocumentTitle(song); });
            }
            AppNavService.prototype.signIn = function () {
                this.$location.url("/signin");
            };
            AppNavService.prototype.nowPlaying = function () {
                this.$location.url("/nowplaying");
            };
            AppNavService.prototype.promptSignIn = function () {
                this.$location.url(this.promptSignInUrl.replace("#", ""));
            };
            AppNavService.prototype.register = function (attemptedEmail) {
                if (attemptedEmail) {
                    this.$location.url("/register/" + encodeURIComponent(attemptedEmail));
                }
                else {
                    this.$location.url("/register");
                }
            };
            AppNavService.prototype.createPassword = function (email) {
                this.$location.url("/createpassword/" + encodeURIComponent(email));
            };
            AppNavService.prototype.password = function (email) {
                this.$location.url("/password/" + encodeURIComponent(email));
            };
            AppNavService.prototype.editAlbumById = function (albumId) {
                this.$location.url("/admin/album/" + albumId);
            };
            AppNavService.prototype.editAlbum = function (artist, album) {
                var escapedArtist = encodeURIComponent(artist);
                var escapedAlbum = encodeURIComponent(album);
                this.$location.url("/admin/album/" + escapedArtist + "/" + escapedAlbum);
            };
            AppNavService.prototype.getEditSongUrl = function (songId) {
                return "/edit/" + songId;
            };
            AppNavService.prototype.showSongRequestDialog = function () {
                var requestSongDialog = this.$uibModal.open({
                    controller: "RequestSongController as vm",
                    templateUrl: this.templatePaths.songRequestModal,
                    windowClass: "request-song-modal"
                });
                return requestSongDialog;
            };
            AppNavService.prototype.createAlbum = function () {
                this.$location.url("/admin/album/create");
            };
            /**
             * Gets the client-side query parameters, returned as an object map.
             */
            AppNavService.prototype.getQueryParams = function () {
                return this.$location.search();
            };
            AppNavService.prototype.updateDocumentTitle = function (song) {
                // Update the document title so that the browser tab updates.
                if (song) {
                    document.title = song.name + " by " + song.artist + " on Chavah Messianic Radio";
                }
                else {
                    document.title = "Chavah Messianic Radio";
                }
            };
            return AppNavService;
        }());
        AppNavService.$inject = [
            "audioPlayer",
            "templatePaths",
            "$location",
            "$uibModal"
        ];
        Chavah.AppNavService = AppNavService;
        Chavah.App.service("appNav", AppNavService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ArtistApiService = (function () {
            function ArtistApiService(httpApi) {
                this.httpApi = httpApi;
            }
            ArtistApiService.prototype.getAll = function (search, skip, take) {
                if (search === void 0) { search = ""; }
                if (skip === void 0) { skip = 0; }
                if (take === void 0) { take = 1024; }
                var args = {
                    search: search,
                    skip: skip,
                    take: take
                };
                return this.httpApi.query("/api/artists/all", args);
            };
            ArtistApiService.prototype.getByName = function (artistName) {
                var args = {
                    artistName: artistName
                };
                return this.httpApi.query("/api/artists/getByName", args, ArtistApiService.artistSelector);
            };
            ArtistApiService.prototype.save = function (artist) {
                return this.httpApi.post("/api/artists/save", artist, ArtistApiService.artistSelector);
            };
            ArtistApiService.artistSelector = function (serverObj) {
                return new Chavah.Artist(serverObj);
            };
            return ArtistApiService;
        }());
        ArtistApiService.$inject = ["httpApi"];
        Chavah.ArtistApiService = ArtistApiService;
        Chavah.App.service("artistApi", ArtistApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AudioPlayerService = (function () {
            function AudioPlayerService(songApi) {
                this.songApi = songApi;
                this.status = new Rx.BehaviorSubject(Chavah.AudioStatus.Paused);
                this.song = new Rx.BehaviorSubject(null);
                this.songCompleted = new Rx.BehaviorSubject(null);
                this.playedTimeText = new Rx.BehaviorSubject("");
                this.remainingTimeText = new Rx.BehaviorSubject("");
                this.playedTimePercentage = new Rx.BehaviorSubject(0);
                this.duration = new Rx.BehaviorSubject(0);
                this.playedSongs = [];
                this.audioErrors = new Rx.Subject();
                this.lastPlayedTime = 0;
                // Commented out: finding out about audio errors on the client turns out to not be very useful; it's often caused by client-side issues outside our control (bad internet connection, etc.)
                // Listen for audio errors.
                //this.audioErrors
                //    .throttle(10000) // If the CDN is down, we don't want to submit thousands of errors. Throttle it.
                //    .subscribe(val => this.submitAudioError(val));
            }
            AudioPlayerService.prototype.initialize = function (audio) {
                var _this = this;
                var supportsMp3Audio = Modernizr.audio.mp3;
                if (supportsMp3Audio) {
                    this.audio = audio;
                    //this.audio.addEventListener("abort", (args) => this.aborted(args));
                    this.audio.addEventListener("ended", function () { return _this.ended(); });
                    this.audio.addEventListener("error", function (args) { return _this.erred(args); });
                    this.audio.addEventListener("pause", function () { return _this.status.onNext(Chavah.AudioStatus.Paused); });
                    this.audio.addEventListener("play", function () { return _this.status.onNext(Chavah.AudioStatus.Playing); });
                    this.audio.addEventListener("playing", function () { return _this.status.onNext(Chavah.AudioStatus.Playing); });
                    this.audio.addEventListener("waiting", function () { return _this.status.onNext(Chavah.AudioStatus.Buffering); });
                    this.audio.addEventListener("stalled", function (args) { return _this.stalled(args); });
                    this.audio.addEventListener("timeupdate", function (args) { return _this.playbackPositionChanged(args); });
                }
                else {
                    // UPGRADE TODO
                    //require(["viewmodels/upgradeBrowserDialog"],(UpgradeBrowserDialog) => {
                    //    App.showDialog(new UpgradeBrowserDialog());
                    //});
                }
            };
            AudioPlayerService.prototype.playNewSong = function (song) {
                var currentSong = this.song.getValue();
                if (currentSong) {
                    this.playedSongs.unshift(currentSong);
                    if (this.playedSongs.length > 3) {
                        this.playedSongs.length = 3;
                    }
                }
                this.song.onNext(song);
                this.playNewUri(song.uri);
            };
            AudioPlayerService.prototype.playNewUri = function (uri) {
                if (this.audio) {
                    this.audio.src = "";
                    if (uri) {
                        this.audio.src = uri;
                        this.audio.load();
                        try {
                            this.audio.play();
                        }
                        catch (error) {
                            // This can happen on mobile when we try to play before user interaction. Don't worry about it; it will remain paused until the user clicks play.
                            console.log("Unable to play audio", error);
                        }
                    }
                }
            };
            AudioPlayerService.prototype.playSongById = function (songId) {
                var task = this.songApi.getSongById(songId);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromArtistAndAlbum = function (artist, album) {
                var task = this.songApi.getSongByArtistAndAlbum(artist, album);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromArtist = function (artist) {
                var task = this.songApi.getSongByArtist(artist);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongFromAlbum = function (album) {
                var task = this.songApi.getSongByAlbum(album);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongWithTag = function (tag) {
                var task = this.songApi.getSongWithTag(tag);
                this.playSongWhenFinishedLoading(task);
            };
            AudioPlayerService.prototype.playSongWhenFinishedLoading = function (task) {
                var _this = this;
                var currentSong = this.song.getValue();
                this.pause();
                task.then(function (songResult) {
                    var isStillWaitingForSong = _this.song.getValue() === currentSong;
                    if (isStillWaitingForSong) {
                        if (songResult) {
                            _this.playNewSong(songResult);
                        }
                        else {
                            _this.resume();
                        }
                    }
                });
            };
            AudioPlayerService.prototype.pauseSongById = function (songId) {
                var _this = this;
                this.pause();
                this.songApi.getSongById(songId)
                    .then(function (song) {
                    if (!song) {
                        _this.resume();
                        return;
                    }
                    var unwrappedSong = _this.song.getValue();
                    if (unwrappedSong) {
                        _this.playedSongs.unshift(unwrappedSong);
                    }
                    // Set the current song and URI. But don't play it.
                    _this.song.onNext(song);
                    if (_this.audio) {
                        _this.audio.src = song.uri;
                        _this.audio.load();
                        _this.audio.pause();
                    }
                });
            };
            AudioPlayerService.prototype.resume = function () {
                if (this.audio) {
                    this.audio.play();
                }
            };
            AudioPlayerService.prototype.pause = function () {
                if (this.audio) {
                    this.audio.pause();
                }
            };
            AudioPlayerService.prototype.aborted = function (args) {
                this.status.onNext(Chavah.AudioStatus.Aborted);
                console.log("Audio aborted", this.audio.currentSrc, args);
            };
            AudioPlayerService.prototype.erred = function (args) {
                this.status.onNext(Chavah.AudioStatus.Erred);
                console.log("Audio erred. Error code: ", this.audio.error, "Audio source: ", this.audio.currentSrc, "Error event: ", args);
                var currentSong = this.song.getValue();
                this.audioErrors.onNext({
                    errorCode: this.audio.error,
                    songId: currentSong ? currentSong.id : "",
                    trackPosition: this.audio.currentTime
                });
            };
            AudioPlayerService.prototype.ended = function () {
                var currentSong = this.song.getValue();
                if (this.audio && currentSong && this.audio.src === encodeURI(currentSong.uri)) {
                    this.songCompleted.onNext(currentSong);
                }
                this.status.onNext(Chavah.AudioStatus.Ended);
            };
            AudioPlayerService.prototype.stalled = function (args) {
                this.status.onNext(Chavah.AudioStatus.Stalled);
                console.log("Audio stalled, unable to stream in audio data.", this.audio.currentSrc, args);
            };
            AudioPlayerService.prototype.playbackPositionChanged = function (args) {
                var currentTime = this.audio.currentTime;
                var currentTimeFloored = Math.floor(currentTime);
                var currentTimeHasChanged = currentTimeFloored !== this.lastPlayedTime;
                if (currentTimeHasChanged) {
                    this.lastPlayedTime = currentTimeFloored;
                    var duration = this.audio.duration;
                    this.duration.onNext(duration);
                    var currentPositionDate = new Date().setMinutes(0, currentTimeFloored);
                    var currentPosition = moment(currentPositionDate);
                    var remainingTimeDate = new Date().setMinutes(0, duration - currentTimeFloored);
                    var remainingTime = moment(remainingTimeDate);
                    this.playedTimeText.onNext(currentPosition.format("m:ss"));
                    this.remainingTimeText.onNext(remainingTime.format("m:ss"));
                    this.playedTimePercentage.onNext((100 / duration) * currentTimeFloored);
                }
            };
            AudioPlayerService.prototype.submitAudioError = function (val) {
                this.songApi.songFailed(val);
            };
            return AudioPlayerService;
        }());
        AudioPlayerService.$inject = ["songApi"];
        Chavah.AudioPlayerService = AudioPlayerService;
        Chavah.App.service("audioPlayer", AudioPlayerService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HttpApiService = (function () {
            function HttpApiService(loadingProgress, $http, localStorageService, $q) {
                this.loadingProgress = loadingProgress;
                this.$http = $http;
                this.localStorageService = localStorageService;
                this.$q = $q;
                this.apiBaseUrl = "";
            }
            HttpApiService.prototype.query = function (relativeUrl, args, selector, showProgress) {
                var _this = this;
                if (args === void 0) { args = null; }
                if (showProgress === void 0) { showProgress = true; }
                var progress;
                if (showProgress) {
                    progress = this.loadingProgress.start();
                }
                else {
                    progress = this.$q.defer();
                }
                var config = {
                    url: this.apiBaseUrl + relativeUrl,
                    method: "GET",
                    params: args,
                    headers: this.createHeaders()
                };
                this.$http(config)
                    .then(function (result) {
                    var preppedResult = selector ? selector(result.data) : result.data;
                    progress.resolve(preppedResult);
                }, function (failed) {
                    progress.reject(failed);
                    _this.onAjaxError(failed, "Error loading " + relativeUrl + ".");
                });
                return progress.promise;
            };
            HttpApiService.prototype.post = function (relativeUrl, args, selector, showProgress) {
                var _this = this;
                if (showProgress === void 0) { showProgress = true; }
                var deferred;
                if (showProgress) {
                    deferred = this.loadingProgress.start();
                }
                else {
                    deferred = this.$q.defer();
                }
                var absoluteUrl = "" + this.apiBaseUrl + relativeUrl;
                var config = {
                    headers: this.createHeaders()
                };
                var postTask = this.$http.post(absoluteUrl, args, config);
                postTask.then(function (result) {
                    var preppedResult = selector ? selector(result.data) : result.data;
                    deferred.resolve(preppedResult);
                });
                postTask.catch(function (error) {
                    _this.onAjaxError(error, "Error saving " + relativeUrl + ".");
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            HttpApiService.prototype.postUriEncoded = function (relativeUrl, args, selector, showProgress) {
                var _this = this;
                if (showProgress === void 0) { showProgress = true; }
                var deferred;
                if (showProgress) {
                    deferred = this.loadingProgress.start();
                }
                else {
                    deferred = this.$q.defer();
                }
                var absoluteUrl = "" + this.apiBaseUrl + relativeUrl + "?";
                var config = {
                    headers: this.createHeaders()
                };
                // Encode the args into the URL
                for (var prop in args) {
                    var isFirstArgument = absoluteUrl.endsWith("?");
                    absoluteUrl += isFirstArgument ? "" : "&";
                    var arg = args[prop];
                    var argAsString = arg ? arg.toString() : "";
                    var argEscaped = encodeURIComponent(argAsString);
                    absoluteUrl += prop + "=" + argEscaped;
                }
                var postTask = this.$http.post(absoluteUrl, null, config);
                postTask.then(function (result) {
                    var preppedResult = selector ? selector(result.data) : result.data;
                    deferred.resolve(preppedResult);
                });
                postTask.catch(function (error) {
                    _this.onAjaxError(error, "Error saving " + relativeUrl + ".");
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            HttpApiService.prototype.createHeaders = function () {
                var jwtAuthHeader = this.createJwtAuthHeader();
                if (jwtAuthHeader) {
                    return { "Authorization": jwtAuthHeader };
                }
                return {};
            };
            HttpApiService.prototype.createJwtAuthHeader = function () {
                var jwt = this.localStorageService.get(Chavah.AccountService.jwtKey);
                if (jwt) {
                    return "Bearer " + jwt;
                }
                return "";
            };
            HttpApiService.prototype.onAjaxError = function (errorDetails, errorMessage) {
                // If we got 401 unauthorized, the token is probably stale or invalid. Go to sign in.
                //if (errorDetails && errorDetails.status === 401) {
                //    this.appNav.signIn();
                //} else {
                //    this.errors.push({
                //        error: errorDetails,
                //        message: errorMessage
                //    });
                //    this.isShowingApiError = true;
                //}
            };
            return HttpApiService;
        }());
        HttpApiService.$inject = [
            "loadingProgress",
            "$http",
            "localStorageService",
            "$q"
        ];
        Chavah.HttpApiService = HttpApiService;
        Chavah.App.service("httpApi", HttpApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LikeApiService = (function () {
            function LikeApiService(httpApi) {
                this.httpApi = httpApi;
            }
            LikeApiService.prototype.dislikeSong = function (songId) {
                return this.httpApi.post("/api/likes/dislike?songId=" + songId, null);
            };
            LikeApiService.prototype.likeSong = function (songId) {
                return this.httpApi.post("/api/likes/like?songId=" + songId, null);
            };
            return LikeApiService;
        }());
        LikeApiService.$inject = ["httpApi"];
        Chavah.LikeApiService = LikeApiService;
        Chavah.App.service("likeApi", LikeApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Service that allows you to create deferred objects that show loading UI.
         * When the loading is completed, if no other load operations are occurring,  the loading UI will be hidden.
         */
        var LoadingProgressService = (function () {
            function LoadingProgressService($q) {
                this.$q = $q;
                this.resultsInProgress = 0;
            }
            ;
            /**
             * Creates a deferred object and shows the loading UI until the deferred work completes.
             */
            LoadingProgressService.prototype.start = function () {
                var _this = this;
                var deferred = this.$q.defer();
                this.loadingStarted();
                deferred.promise.finally(function () { return _this.loadingEnded(); });
                return deferred;
            };
            Object.defineProperty(LoadingProgressService.prototype, "isLoading", {
                get: function () {
                    return this.resultsInProgress > 0;
                },
                enumerable: true,
                configurable: true
            });
            LoadingProgressService.prototype.loadingStarted = function () {
                this.resultsInProgress++;
                if (this.resultsInProgress === 1) {
                    NProgress.start();
                }
            };
            LoadingProgressService.prototype.loadingEnded = function () {
                this.resultsInProgress--;
                if (this.resultsInProgress === 0) {
                    NProgress.done();
                }
            };
            return LoadingProgressService;
        }());
        LoadingProgressService.$inject = ["$q"];
        Chavah.LoadingProgressService = LoadingProgressService;
        Chavah.App.service("loadingProgress", LoadingProgressService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogService = (function () {
            function LogService(httpApi) {
                this.httpApi = httpApi;
            }
            LogService.prototype.getAll = function (skip, take) {
                var args = {
                    skip: skip,
                    take: take
                };
                return this.httpApi.query("/api/logs/getAll", args);
            };
            LogService.prototype.deleteLog = function (logId) {
                var args = {
                    id: logId
                };
                return this.httpApi.postUriEncoded("/api/logs/delete", args);
            };
            return LogService;
        }());
        LogService.$inject = ["httpApi"];
        Chavah.LogService = LogService;
        Chavah.App.service("logApi", LogService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongApiService = (function () {
            function SongApiService(httpApi) {
                this.httpApi = httpApi;
            }
            SongApiService.prototype.chooseSong = function () {
                return this.httpApi.query("/api/songs/chooseSong", null, SongApiService.songConverter);
            };
            SongApiService.prototype.chooseSongBatch = function () {
                return this.httpApi.query("/api/songs/chooseSongBatch", null, SongApiService.songListConverter);
            };
            SongApiService.prototype.getSongById = function (id, songPickReason) {
                var task = this.httpApi.query("/api/songs/getById", { songId: id }, SongApiService.songOrNullConverter);
                if (songPickReason != null) {
                    task.then(function (song) {
                        if (song) {
                            song.setSolePickReason(songPickReason);
                        }
                    });
                }
                return task;
            };
            SongApiService.prototype.getSongByArtistAndAlbum = function (artist, album) {
                var url = "/api/songs/getByArtistAndAlbum";
                var args = {
                    artist: artist,
                    album: album
                };
                return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
            };
            SongApiService.prototype.getSongByAlbum = function (album) {
                var url = "/api/songs/getByAlbum/";
                var args = {
                    album: album
                };
                return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
            };
            SongApiService.prototype.getSongWithTag = function (tag) {
                var url = "/api/songs/getByTag";
                var args = {
                    tag: tag
                };
                return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
            };
            SongApiService.prototype.getSongByArtist = function (artist) {
                var url = "/api/songs/getByArtist";
                var args = {
                    artist: artist
                };
                return this.httpApi.query(url, args, SongApiService.songOrNullConverter);
            };
            SongApiService.prototype.getSongMatches = function (searchText) {
                var url = "/api/songs/search";
                var args = {
                    searchText: searchText
                };
                return this.httpApi.query(url, args, SongApiService.songListConverter);
            };
            SongApiService.prototype.getTrendingSongs = function (skip, take) {
                var args = {
                    skip: skip,
                    take: take
                };
                return this.httpApi.query("/api/songs/getTrending", args, SongApiService.songPagedListConverter);
            };
            SongApiService.prototype.getPopularSongs = function (count) {
                var args = {
                    count: count
                };
                return this.httpApi.query("/api/songs/top", args, SongApiService.songListConverter);
            };
            SongApiService.prototype.getLikes = function (count) {
                var args = {
                    count: count
                };
                return this.httpApi.query("/api/songs/getRandomLikedSongs", args, SongApiService.songListConverter);
            };
            SongApiService.prototype.getRecentPlays = function (count) {
                var args = {
                    count: count
                };
                return this.httpApi.query("/api/songs/getRecentPlays", args, SongApiService.songListConverter);
            };
            SongApiService.prototype.songCompleted = function (songId) {
                return this.httpApi.post("/api/songs/completed?songId=" + songId, null);
            };
            SongApiService.prototype.songFailed = function (error) {
                return this.httpApi.post("/api/songs/audiofailed", error);
            };
            SongApiService.songPagedListConverter = function (dto) {
                return {
                    items: dto.items.map(function (s) { return new Chavah.Song(s); }),
                    skip: dto.skip,
                    take: dto.take,
                    total: dto.total
                };
            };
            SongApiService.songListConverter = function (songs) {
                return songs.map(function (r) { return SongApiService.songConverter(r); });
            };
            SongApiService.songOrNullConverter = function (raw) {
                if (raw) {
                    return SongApiService.songConverter(raw);
                }
                return null;
            };
            SongApiService.songConverter = function (raw) {
                return new Chavah.Song(raw);
            };
            return SongApiService;
        }());
        SongApiService.$inject = ["httpApi"];
        Chavah.SongApiService = SongApiService;
        Chavah.App.service("songApi", SongApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * SongBatchService fetches a group of songs in a single remote call.
         * This makes the UI more responsive, quickly playing the next song without having to make extra remote calls.
         */
        var SongBatchService = (function () {
            function SongBatchService(audioPlayer, songApi, songRequestApi, accountApi) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.songApi = songApi;
                this.songRequestApi = songRequestApi;
                this.accountApi = accountApi;
                this.songsBatch = new Rx.BehaviorSubject([]);
                // Listen for when we sign in. When that happens, we want to refresh our song batch.
                // Refreshing the batch is needed to update the song like statuses, etc. of the songs in the batch.
                accountApi.signedIn
                    .distinctUntilChanged()
                    .subscribe(function (signedIn) { return _this.signedInChanged(signedIn); });
            }
            SongBatchService.prototype.playNext = function () {
                var _this = this;
                // Play any song remaining from the batch.
                if (this.songsBatch.getValue().length > 0) {
                    var song = this.songsBatch.getValue().splice(0, 1)[0]; // Remove the top item.
                    this.songsBatch.onNext(this.songsBatch.getValue());
                    this.audioPlayer.playNewSong(song);
                }
                else {
                    // Woops, we don't have any songs at all. Request just one (fast), then ask for a batch.
                    this.songApi
                        .chooseSong()
                        .then(function (song) {
                        _this.audioPlayer.playNewSong(song);
                        _this.fetchSongBatch();
                    });
                }
                var needMoreSongs = this.songsBatch.getValue().length < 5;
                if (needMoreSongs) {
                    this.fetchSongBatch();
                }
            };
            SongBatchService.prototype.fetchSongBatch = function () {
                var _this = this;
                this.songApi
                    .chooseSongBatch()
                    .then(function (songs) {
                    var existingSongBatch = _this.songsBatch.getValue();
                    var freshSongs = songs
                        .filter(function (s) { return existingSongBatch.map(function (s) { return s.id; }).indexOf(s.id) === -1; })
                        .filter(function (s) { return !_this.songRequestApi.isSongPendingRequest(s.id); });
                    _this.songsBatch.onNext(existingSongBatch.concat(freshSongs));
                });
            };
            SongBatchService.prototype.signedInChanged = function (isSignedIn) {
                var hasBatchSongs = this.songsBatch.getValue().length > 0;
                if (isSignedIn && hasBatchSongs) {
                    // Discard the current batch and fetch a fresh batch.
                    this.songsBatch.onNext([]);
                    this.fetchSongBatch();
                }
            };
            return SongBatchService;
        }());
        SongBatchService.$inject = [
            "audioPlayer",
            "songApi",
            "songRequestApi",
            "accountApi"
        ];
        Chavah.SongBatchService = SongBatchService;
        Chavah.App.service("songBatch", SongBatchService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditService = (function () {
            function SongEditService(httpApi) {
                this.httpApi = httpApi;
            }
            SongEditService.prototype.submit = function (song) {
                return this.httpApi.post("/api/songEdits/edit", song);
            };
            SongEditService.prototype.getPendingEdits = function (take) {
                var args = {
                    take: take
                };
                return this.httpApi.query("/api/songEdits/getPendingEdits", args);
            };
            SongEditService.prototype.approve = function (songEdit) {
                return this.httpApi.post("/api/songEdits/approve", songEdit);
            };
            SongEditService.prototype.reject = function (songEditId) {
                var args = {
                    songEditId: songEditId
                };
                return this.httpApi.postUriEncoded("/api/songEdits/reject", args);
            };
            return SongEditService;
        }());
        SongEditService.$inject = [
            "httpApi"
        ];
        Chavah.SongEditService = SongEditService;
        Chavah.App.service("songEditApi", SongEditService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongRequestApiService = (function () {
            function SongRequestApiService(httpApi, audioPlayer, songApi) {
                this.httpApi = httpApi;
                this.audioPlayer = audioPlayer;
                this.songApi = songApi;
                this.pendingSongRequestIds = [];
                this.hasPlayedRequestAnnouncement = false;
            }
            SongRequestApiService.prototype.hasPendingRequest = function () {
                var _this = this;
                var hasPendingRequest = this.pendingSongRequestIds.length > 0;
                if (this.pendingSongRequestIds.length === 0) {
                    setTimeout(function () { return _this.fetchPendingSongRequests(); }, 2000);
                }
                return hasPendingRequest;
            };
            SongRequestApiService.prototype.isSongPendingRequest = function (songId) {
                return this.pendingSongRequestIds.indexOf(songId) !== -1;
            };
            SongRequestApiService.prototype.requestSong = function (song) {
                this.pendingSongRequestIds.unshift(song.id);
                this.hasPlayedRequestAnnouncement = false;
                var url = "/api/requests/requestsong?songId=" + song.id;
                return this.httpApi.post(url, null);
            };
            SongRequestApiService.prototype.playRequest = function () {
                var _this = this;
                if (!this.hasPendingRequest()) {
                    throw "There was no pending song request.";
                }
                if (!this.hasPlayedRequestAnnouncement) {
                    this.hasPlayedRequestAnnouncement = true;
                    var songRequestNumbers = [1, 3, 4, 5, 6, 7, 8, 9, 10];
                    var songRequestName = "SongRequest" + songRequestNumbers[Math.floor(Math.random() * songRequestNumbers.length)] + ".mp3";
                    var songRequestUrl = "https://bitshuvafiles01.com/chavah/soundEffects/" + songRequestName;
                    this.audioPlayer.playNewUri(songRequestUrl);
                }
                else {
                    this.hasPlayedRequestAnnouncement = false;
                    var pendingRequestedSongId = this.pendingSongRequestIds.splice(0, 1)[0];
                    var currentSong = this.audioPlayer.song.getValue();
                    this.songApi.getSongById(pendingRequestedSongId, Chavah.SongPick.SomeoneRequestedSong)
                        .then(function (song) {
                        var isStillWaitingForSong = _this.audioPlayer.song.getValue() === currentSong;
                        if (isStillWaitingForSong && song) {
                            _this.audioPlayer.playNewSong(song);
                        }
                    });
                }
            };
            SongRequestApiService.prototype.removePendingSongRequest = function (songId) {
                this.pendingSongRequestIds = this.pendingSongRequestIds.filter(function (id) { return id !== songId; });
            };
            SongRequestApiService.prototype.fetchPendingSongRequests = function () {
                var _this = this;
                return this.httpApi.query("/api/requests/pending")
                    .then(function (songIdOrNull) {
                    if (songIdOrNull && _this.pendingSongRequestIds.indexOf(songIdOrNull) === -1) {
                        _this.pendingSongRequestIds.push(songIdOrNull);
                    }
                });
            };
            return SongRequestApiService;
        }());
        SongRequestApiService.$inject = [
            "httpApi",
            "audioPlayer",
            "songApi"
        ];
        Chavah.SongRequestApiService = SongRequestApiService;
        Chavah.App.service("songRequestApi", SongRequestApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var StationIdentifierService = (function () {
            function StationIdentifierService(audioPlayer) {
                this.audioPlayer = audioPlayer;
                this.lastAnnouncementTime = new Date();
            }
            StationIdentifierService.prototype.hasPendingAnnouncement = function () {
                // We play an announcement on the 00s and 30s.
                // Check if we're within 5 minutes of a 00 or 30, and 
                // check if we haven't played the annoucement in 20+ minutes.
                var currentTime = new Date();
                var currentMinute = currentTime.getMinutes();
                var isOnHalfHour = (currentMinute > 55 || currentMinute < 5) || (currentMinute > 25 && currentMinute < 35);
                var minutesDifferenceSinceLastAnnouncement = (currentTime.valueOf() - this.lastAnnouncementTime.valueOf()) / 60000;
                var hasBeen15MinutesSinceLastAnnouncement = minutesDifferenceSinceLastAnnouncement >= 15;
                if (hasBeen15MinutesSinceLastAnnouncement && isOnHalfHour) {
                    this.lastAnnouncementTime = currentTime;
                    return true;
                }
                return false;
            };
            StationIdentifierService.prototype.playStationIdAnnouncement = function () {
                var announcementNumbers = [1, 2, 3, 4, 5, 6];
                var songRequestName = "StationId" + announcementNumbers[Math.floor(Math.random() * announcementNumbers.length)] + ".mp3";
                var songUrl = "https://bitshuvafiles01.com/chavah/soundEffects/" + songRequestName;
                this.audioPlayer.playNewUri(songUrl);
            };
            return StationIdentifierService;
        }());
        StationIdentifierService.$inject = [
            "audioPlayer"
        ];
        Chavah.StationIdentifierService = StationIdentifierService;
        Chavah.App.service("stationIdentifier", StationIdentifierService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TagService = (function () {
            function TagService(httpApi) {
                this.httpApi = httpApi;
            }
            TagService.prototype.getAll = function () {
                return this.httpApi.query("/api/tags/getAll");
            };
            TagService.prototype.renameTag = function (oldTag, newTag) {
                var args = {
                    oldTag: oldTag,
                    newTag: newTag
                };
                return this.httpApi.postUriEncoded("/api/tags/rename", args);
            };
            TagService.prototype.deleteTag = function (tag) {
                var args = {
                    tag: tag
                };
                return this.httpApi.postUriEncoded("/api/tags/delete", args);
            };
            TagService.prototype.searchTags = function (search) {
                var args = {
                    search: search
                };
                return this.httpApi.query("/api/tags/searchTags", args);
            };
            return TagService;
        }());
        TagService.$inject = ["httpApi"];
        Chavah.TagService = TagService;
        Chavah.App.service("tagApi", TagService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
    Array.prototype.includes = function (searchElement /*, fromIndex*/) {
        'use strict';
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
            return false;
        }
        var n = parseInt(arguments[1]) || 0;
        var k;
        if (n >= 0) {
            k = n;
        }
        else {
            k = len + n;
            if (k < 0) {
                k = 0;
            }
        }
        var currentElement;
        while (k < len) {
            currentElement = O[k];
            if (searchElement === currentElement ||
                (searchElement !== searchElement && currentElement !== currentElement)) {
                return true;
            }
            k++;
        }
        return false;
    };
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;
        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
// Typings for MediaSession APIs, a new set of APIs being adopted on mobile browsers 
// to show media info (art, album, artist, song name, etc.) on the phone's lock screen.
// String.includes, ES6 standard https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/includes
if (!String.prototype.includes) {
    String.prototype.includes = function () {
        'use strict';
        return String.prototype.indexOf.apply(this, arguments) !== -1;
    };
}
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (position === undefined || position > subjectString.length) {
            position = subjectString.length;
        }
        if (position !== undefined && position !== null) {
            position -= searchString.length;
        }
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.lastIndexOf(searchString, position) === position;
    };
}
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Album = (function () {
            function Album(serverObj) {
                this.isSaving = false;
                angular.merge(this, serverObj);
            }
            return Album;
        }());
        Chavah.Album = Album;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Artist = (function () {
            function Artist(serverObj) {
                this.isSaving = false;
                if (!serverObj) {
                    serverObj = Artist.createDefaultServerObj();
                }
                angular.merge(this, serverObj);
            }
            Artist.prototype.updateFrom = function (serverObj) {
                angular.merge(this, serverObj);
            };
            Artist.createDefaultServerObj = function () {
                return {
                    bio: "",
                    images: [],
                    name: ""
                };
            };
            return Artist;
        }());
        Chavah.Artist = Artist;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AudioStatus;
        (function (AudioStatus) {
            AudioStatus[AudioStatus["Paused"] = 0] = "Paused";
            AudioStatus[AudioStatus["Playing"] = 1] = "Playing";
            AudioStatus[AudioStatus["Ended"] = 2] = "Ended";
            AudioStatus[AudioStatus["Erred"] = 3] = "Erred";
            AudioStatus[AudioStatus["Stalled"] = 4] = "Stalled";
            AudioStatus[AudioStatus["Buffering"] = 5] = "Buffering";
            AudioStatus[AudioStatus["Aborted"] = 6] = "Aborted";
        })(AudioStatus = Chavah.AudioStatus || (Chavah.AudioStatus = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var CommunityRankStanding;
        (function (CommunityRankStanding) {
            CommunityRankStanding[CommunityRankStanding["Normal"] = 0] = "Normal";
            CommunityRankStanding[CommunityRankStanding["VeryPoor"] = 1] = "VeryPoor";
            CommunityRankStanding[CommunityRankStanding["Poor"] = 2] = "Poor";
            CommunityRankStanding[CommunityRankStanding["Good"] = 3] = "Good";
            CommunityRankStanding[CommunityRankStanding["Great"] = 4] = "Great";
            CommunityRankStanding[CommunityRankStanding["Best"] = 5] = "Best";
        })(CommunityRankStanding = Chavah.CommunityRankStanding || (Chavah.CommunityRankStanding = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HeaderRoute;
        (function (HeaderRoute) {
            HeaderRoute[HeaderRoute["NowPlaying"] = 0] = "NowPlaying";
            HeaderRoute[HeaderRoute["Trending"] = 1] = "Trending";
            HeaderRoute[HeaderRoute["Top"] = 2] = "Top";
            HeaderRoute[HeaderRoute["Likes"] = 3] = "Likes";
            HeaderRoute[HeaderRoute["Other"] = 4] = "Other";
        })(HeaderRoute = Chavah.HeaderRoute || (Chavah.HeaderRoute = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LikeLevel;
        (function (LikeLevel) {
            LikeLevel[LikeLevel["NotSpecified"] = 0] = "NotSpecified";
            LikeLevel[LikeLevel["Like"] = 1] = "Like";
            LikeLevel[LikeLevel["Love"] = 2] = "Love";
            LikeLevel[LikeLevel["Favorite"] = 3] = "Favorite";
        })(LikeLevel = Chavah.LikeLevel || (Chavah.LikeLevel = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogLevel;
        (function (LogLevel) {
            LogLevel[LogLevel["Error"] = 0] = "Error";
            LogLevel[LogLevel["Warn"] = 1] = "Warn";
            LogLevel[LogLevel["Info"] = 2] = "Info";
            LogLevel[LogLevel["Debug"] = 3] = "Debug";
        })(LogLevel = Chavah.LogLevel || (Chavah.LogLevel = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SignInResult = (function () {
            function SignInResult() {
            }
            return SignInResult;
        }());
        Chavah.SignInResult = SignInResult;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SignInStatus;
        (function (SignInStatus) {
            SignInStatus[SignInStatus["Success"] = 0] = "Success";
            SignInStatus[SignInStatus["LockedOut"] = 1] = "LockedOut";
            SignInStatus[SignInStatus["RequiresVerification"] = 2] = "RequiresVerification";
            SignInStatus[SignInStatus["Failure"] = 3] = "Failure";
        })(SignInStatus = Chavah.SignInStatus || (Chavah.SignInStatus = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Song = (function () {
            function Song(song) {
                this.albumArtOrArtistImage = "";
                this.isCumulativeRank = true;
                this.albumSwatchBackground = "white";
                this.albumSwatchForeground = "black";
                this.albumSwatchMuted = "silver";
                this.albumSwatchTextShadow = "white";
                this.albumSwatchDarker = "black"; // The darker of two: either foreground or background
                this.albumSwatchLighter = "white"; // The lighter of the two: either foreground or background
                this.hasSetAlbumArtColors = false;
                this.isLyricsExpanded = false;
                this.isSongStatusExpanded = false;
                this.isSupportExpanded = false;
                this.isShareExpanded = false;
                this.isEditingLyrics = false;
                this.isShowingEmbedCode = false;
                angular.merge(this, song);
                this.clientId = song.id + "_" + (new Date().getTime() + Math.random());
            }
            Object.defineProperty(Song.prototype, "communityRankText", {
                get: function () {
                    if (this.communityRank > 0) {
                        return "+" + this.communityRank.toString();
                    }
                    return this.communityRank.toString();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "communityRankStandingText", {
                get: function () {
                    switch (this.communityRankStanding) {
                        case Chavah.CommunityRankStanding.Best: return "Best";
                        case Chavah.CommunityRankStanding.Good: return "Good";
                        case Chavah.CommunityRankStanding.Great: return "Great";
                        case Chavah.CommunityRankStanding.Poor: return "Poor";
                        case Chavah.CommunityRankStanding.VeryPoor: return "Very Poor";
                        case Chavah.CommunityRankStanding.Normal:
                        default: return "Average";
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "nthSongText", {
                get: function () {
                    var value = this.number === 0 ? "1st" :
                        this.number === 1 ? "1st" :
                            this.number === 2 ? "2nd" :
                                this.number === 3 ? "3rd" :
                                    this.number >= 4 && this.number <= 19 ? this.number + "th" :
                                        "#" + this.number;
                    return value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "reasonPlayedText", {
                get: function () {
                    if (!this._reasonPlayedText) {
                        this._reasonPlayedText = this.createReasonPlayedText();
                    }
                    return this._reasonPlayedText;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "facebookShareUrl", {
                get: function () {
                    if (!this._facebookShareUrl) {
                        var name = (this.artist + " - " + this.name).replace(new RegExp("&", 'g'), "and"); // Yes, replace ampersand. Even though we escape it via encodeURIComponent, Facebook barfs on it.
                        var url = "https://messianicradio.com?song=" + this.id;
                        var albumArtUrl = "https://messianicradio.com/api/albums/art/forSong?songId=" + this.id;
                        this._facebookShareUrl = "https://www.facebook.com/dialog/feed?app_id=256833604430846" +
                            ("&link=" + url) +
                            ("&picture=" + encodeURIComponent(albumArtUrl)) +
                            ("&name=" + encodeURIComponent(name)) +
                            ("&description=" + encodeURIComponent("On " + this.album)) +
                            ("&caption=" + encodeURIComponent("Courtesy of Chavah Messianic Radio - The very best Messianic Jewish and Hebrew Roots music")) +
                            ("&redirect_uri=" + encodeURIComponent("https://messianicradio.com/#/sharethanks"));
                    }
                    return this._facebookShareUrl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "twitterShareUrl", {
                get: function () {
                    if (!this._twitterShareUrl) {
                        var tweetText = 'Listening to "' + this.artist + " - " + this.name + '"';
                        var url = "https://messianicradio.com/?song=" + this.id;
                        var via = "messianicradio";
                        this._twitterShareUrl = "https://twitter.com/share" +
                            "?text=" + encodeURIComponent(tweetText) +
                            "&url=" + encodeURIComponent(url) +
                            "&via=" + encodeURIComponent(via);
                    }
                    return this._twitterShareUrl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "googlePlusShareUrl", {
                get: function () {
                    if (!this._googlePlusShareUrl) {
                        this._googlePlusShareUrl = "https://plus.google.com/share?url=" + encodeURI("https://messianicradio.com/?song=" + this.id);
                    }
                    return this._googlePlusShareUrl;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Song.prototype, "shareUrl", {
                get: function () {
                    return "https://messianicradio.com/?song=" + this.id;
                },
                enumerable: true,
                configurable: true
            });
            Song.prototype.getEmbedCode = function () {
                return "<iframe style=\"border-top: medium none; height: 558px; border-right: medium none; width: 350px; border-bottom: medium none; border-left: medium none\" src=\"https://messianicradio.com/home/embed?song=" + this.id + "\" scrolling=\"none\"></iframe>";
            };
            Song.prototype.updateFrom = function (other) {
                angular.merge(this, other);
            };
            Song.prototype.updateAlbumArtColors = function (album) {
                this.hasSetAlbumArtColors = true;
                this.albumSwatchBackground = album.backgroundColor || this.albumSwatchBackground;
                this.albumSwatchForeground = album.foregroundColor || this.albumSwatchForeground;
                this.albumSwatchMuted = album.mutedColor || this.albumSwatchMuted;
                this.albumSwatchTextShadow = album.textShadowColor || this.albumSwatchTextShadow;
                // Determine whether the foreground or background is lighter. Used in the now playing page to pick a color that looks readable on near-white background.
                var bgBrightness = tinycolor(this.albumSwatchBackground).getBrightness();
                var fgBrightness = tinycolor(this.albumSwatchForeground).getBrightness();
                var isFgLighter = fgBrightness >= bgBrightness;
                this.albumSwatchLighter = isFgLighter ? this.albumSwatchForeground : this.albumSwatchBackground;
                this.albumSwatchDarker = isFgLighter ? this.albumSwatchBackground : this.albumSwatchForeground;
            };
            Song.empty = function () {
                return new Song({
                    album: "",
                    albumArtUri: "",
                    artist: "",
                    communityRank: 0,
                    communityRankStanding: 0,
                    id: "songs/0",
                    artistImages: [],
                    genres: [],
                    lyrics: "",
                    name: "",
                    number: 0,
                    purchaseUri: "",
                    songLike: 0,
                    tags: [],
                    totalPlays: 0,
                    uri: "",
                    reasonsPlayed: this.createEmptySongPickReasons("songs/0")
                });
            };
            Song.prototype.setSolePickReason = function (reason) {
                this.reasonsPlayed = Song.createEmptySongPickReasons(this.id);
                this.reasonsPlayed.soleReason = reason;
            };
            Song.prototype.createReasonPlayedText = function () {
                // "we played this song because {{text}}"
                var randomReason = "Chavah plays random songs from time to time to see what kind of music you like";
                if (this.reasonsPlayed) {
                    // If there's a sole reason, just list that.
                    if (this.reasonsPlayed.soleReason !== null) {
                        switch (this.reasonsPlayed.soleReason) {
                            case Chavah.SongPick.SomeoneRequestedSong: return "it was requested by a listener";
                            case Chavah.SongPick.SongFromAlbumRequested: return "you asked to hear another song from the " + this.album + " album";
                            case Chavah.SongPick.SongFromArtistRequested: return "you asked to hear another song from " + this.artist;
                            case Chavah.SongPick.SongWithTagRequested: return "you asked to hear another song with this tag";
                            case Chavah.SongPick.VeryPoorRank: return "...well, even the lowest-ranked songs will get played sometimes :-)";
                            case Chavah.SongPick.YouRequestedSong: return "you asked Chavah to play it";
                            case Chavah.SongPick.RandomSong:
                            default:
                                return randomReason;
                        }
                    }
                    // There are zero or more reasons we played this.
                    var reasons = [];
                    if (this.reasonsPlayed.ranking === Chavah.LikeLevel.Favorite) {
                        reasons.push("it's one of the highest ranked songs on Chavah");
                    }
                    else if (this.reasonsPlayed.ranking === Chavah.LikeLevel.Love) {
                        reasons.push("it's got a great community ranking");
                    }
                    else if (this.reasonsPlayed.ranking === Chavah.LikeLevel.Like) {
                        reasons.push("it's got a good community ranking");
                    }
                    if (this.reasonsPlayed.artist === Chavah.LikeLevel.Favorite) {
                        reasons.push(this.artist + " is one of your favorite artists");
                    }
                    else if (this.reasonsPlayed.artist === Chavah.LikeLevel.Love) {
                        reasons.push("you love " + this.artist + " and have thumbed-up an abundance of " + this.artist + " songs");
                    }
                    else if (this.reasonsPlayed.artist === Chavah.LikeLevel.Like) {
                        reasons.push("you like " + this.artist);
                    }
                    if (this.reasonsPlayed.album === Chavah.LikeLevel.Favorite) {
                        reasons.push("you like nearly all the songs on " + this.album);
                    }
                    if (this.reasonsPlayed.album === Chavah.LikeLevel.Love) {
                        reasons.push("you love " + this.album);
                    }
                    else if (this.reasonsPlayed.album === Chavah.LikeLevel.Like) {
                        reasons.push("you like " + this.album);
                    }
                    if (this.reasonsPlayed.songThumbedUp) {
                        reasons.push("you like this song");
                    }
                    if (this.reasonsPlayed.similar === Chavah.LikeLevel.Favorite) {
                        reasons.push("it's similar to some of your favorite songs");
                    }
                    else if (this.reasonsPlayed.similar === Chavah.LikeLevel.Love) {
                        reasons.push("you love similiar songs");
                    }
                    else if (this.reasonsPlayed.similar === Chavah.LikeLevel.Like) {
                        reasons.push("you like similiar songs");
                    }
                    // We're going to join all the reasons together into a single, comma-delimited string.
                    // e.g. "We played this song because you like this song, you love Ted Pearce, and it's one of the top-ranked songs on Chavah.
                    // No reasons? 
                    if (reasons.length === 0) {
                        return "you might like it";
                    }
                    if (reasons.length === 1) {
                        return reasons[0];
                    }
                    if (reasons.length === 2) {
                        return reasons.join(" and ");
                    }
                    // Append "and" to the last reason if there's more than one.
                    reasons[reasons.length - 1] = "and " + reasons[reasons.length - 1];
                    return reasons.join(", ");
                }
                return randomReason;
            };
            // Shuffles an array. Should be moved to a utility class, or maybe just bite the bullet and include lodash.
            Song.shuffle = function (array) {
                var currentIndex = array.length, temporaryValue, randomIndex;
                // While there remain elements to shuffle...
                while (0 !== currentIndex) {
                    // Pick a remaining element...
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }
                return array;
            };
            Song.createEmptySongPickReasons = function (songId) {
                return {
                    album: Chavah.LikeLevel.NotSpecified,
                    artist: Chavah.LikeLevel.NotSpecified,
                    ranking: Chavah.LikeLevel.NotSpecified,
                    similar: Chavah.LikeLevel.NotSpecified,
                    songThumbedUp: false,
                    songId: songId,
                    soleReason: null
                };
            };
            return Song;
        }());
        Song.defaultSwatch = {
            getBodyTextColor: function () { return "black"; },
            getHex: function () { return "white"; },
            getHsl: function () { return "black"; },
            getPopulation: function () { return 0; },
            getTitleTextColor: function () { return "black"; },
            hsl: [255, 255, 255],
            rgb: [255, 255, 255]
        };
        Chavah.Song = Song;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditStatus;
        (function (SongEditStatus) {
            SongEditStatus[SongEditStatus["Pending"] = 0] = "Pending";
            SongEditStatus[SongEditStatus["Rejected"] = 1] = "Rejected";
            SongEditStatus[SongEditStatus["Approved"] = 2] = "Approved";
        })(SongEditStatus = Chavah.SongEditStatus || (Chavah.SongEditStatus = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongLike;
        (function (SongLike) {
            SongLike[SongLike["Unranked"] = 0] = "Unranked";
            SongLike[SongLike["Liked"] = 1] = "Liked";
            SongLike[SongLike["Disliked"] = 2] = "Disliked";
        })(SongLike = Chavah.SongLike || (Chavah.SongLike = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongPick;
        (function (SongPick) {
            SongPick[SongPick["RandomSong"] = 0] = "RandomSong";
            SongPick[SongPick["VeryPoorRank"] = 1] = "VeryPoorRank";
            SongPick[SongPick["PoorRank"] = 2] = "PoorRank";
            SongPick[SongPick["NormalRank"] = 3] = "NormalRank";
            SongPick[SongPick["GoodRank"] = 4] = "GoodRank";
            SongPick[SongPick["GreatRank"] = 5] = "GreatRank";
            SongPick[SongPick["BestRank"] = 6] = "BestRank";
            SongPick[SongPick["LikedArtist"] = 7] = "LikedArtist";
            SongPick[SongPick["LikedAlbum"] = 8] = "LikedAlbum";
            SongPick[SongPick["LikedSong"] = 9] = "LikedSong";
            SongPick[SongPick["LikedTag"] = 10] = "LikedTag";
            SongPick[SongPick["SongFromAlbumRequested"] = 11] = "SongFromAlbumRequested";
            SongPick[SongPick["SongFromArtistRequested"] = 12] = "SongFromArtistRequested";
            SongPick[SongPick["SongWithTagRequested"] = 13] = "SongWithTagRequested";
            SongPick[SongPick["YouRequestedSong"] = 14] = "YouRequestedSong";
            SongPick[SongPick["SomeoneRequestedSong"] = 15] = "SomeoneRequestedSong";
        })(SongPick = Chavah.SongPick || (Chavah.SongPick = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var User = (function () {
            function User(email, roles) {
                this.email = email;
                this.roles = roles;
                this.isAdmin = roles && roles.includes("Admin");
            }
            return User;
        }());
        Chavah.User = User;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that calls a function when the enter key is pressed on an input element.
         */
        var EnterHandler = (function () {
            function EnterHandler(scope, element, attributes, parse) {
                this.scope = scope;
                this.element = element;
                var enterHandler = parse(attributes["enterHandler"]);
                element.on("keydown", function (args) {
                    var enterKey = 13;
                    if (args.keyCode === enterKey) {
                        enterHandler(scope);
                        if (args.preventDefault) {
                            args.preventDefault();
                        }
                        scope.$applyAsync();
                    }
                });
                element.on("$destroy", function () { return element.off("keydown $destroy"); });
            }
            return EnterHandler;
        }());
        var EnterHandlerBinder = (function () {
            function EnterHandlerBinder($parse) {
                this.$parse = $parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            EnterHandlerBinder.prototype.unboundLink = function (scope, element, attributes) {
                new EnterHandler(scope, element, attributes, this.$parse);
            };
            return EnterHandlerBinder;
        }());
        Chavah.App.directive("enterHandler", ["$parse", function ($parse) { return new EnterHandlerBinder($parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that triggers focus on an element given an expression that evaluates to true.
         */
        var TriggerFocus = (function () {
            function TriggerFocus(scope, element, attributes, timeout, parse) {
                this.scope = scope;
                this.element = element;
                var model = parse(attributes["triggerFocus"]);
                scope.$watch(model, function (value) {
                    if (value) {
                        timeout(function () { return element[0].focus(); });
                    }
                });
                element.bind("blur", function () { return scope.$apply(model.assign(scope, false)); });
            }
            return TriggerFocus;
        }());
        var TriggerFocusBinder = (function () {
            function TriggerFocusBinder($timeout, $parse) {
                this.$timeout = $timeout;
                this.$parse = $parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            TriggerFocusBinder.prototype.unboundLink = function (scope, element, attributes) {
                new TriggerFocus(scope, element, attributes, this.$timeout, this.$parse);
            };
            return TriggerFocusBinder;
        }());
        Chavah.App.directive("triggerFocus", ["$timeout", "$parse", function ($timeout, $parse) { return new TriggerFocusBinder($timeout, $parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AlbumsController = (function () {
            function AlbumsController(albumApi, appNav) {
                var _this = this;
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.search = "";
                this.albums = new Chavah.PagedList(function (skip, take) { return _this.albumApi.getAll(skip, take, _this.search); });
                this.isSaving = false;
                this.albums.take = 50;
                this.albums.fetchNextChunk();
            }
            AlbumsController.prototype.searchChanged = function () {
                this.albums.resetAndFetch();
            };
            AlbumsController.prototype.deleteAlbum = function (album) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.isSaving = true;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, , 3, 4]);
                                return [4 /*yield*/, this.albumApi.deleteAlbum(album.id)];
                            case 2:
                                _a.sent();
                                _.pull(this.albums.items, album);
                                return [3 /*break*/, 4];
                            case 3:
                                this.isSaving = false;
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            return AlbumsController;
        }());
        AlbumsController.$inject = [
            "albumApi",
            "appNav"
        ];
        Chavah.AlbumsController = AlbumsController;
        Chavah.App.controller("AlbumsController", AlbumsController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ApproveSongEditsController = (function () {
            function ApproveSongEditsController(songApi, songEditApi, tagApi) {
                var _this = this;
                this.songApi = songApi;
                this.songEditApi = songEditApi;
                this.tagApi = tagApi;
                this.pendingEdits = [];
                this.currentEdit = null;
                this.isSaving = false;
                this.hasLoaded = false;
                this.tagsInput = "";
                this.songEditApi.getPendingEdits(20)
                    .then(function (results) { return _this.pendingEditsLoaded(results); });
            }
            ApproveSongEditsController.prototype.pendingEditsLoaded = function (results) {
                this.pendingEdits = results;
                this.setCurrentEdit(results[0]);
                this.hasLoaded = true;
            };
            ApproveSongEditsController.prototype.setCurrentEdit = function (songEdit) {
                this.currentEdit = songEdit;
            };
            ApproveSongEditsController.prototype.approve = function () {
                var _this = this;
                var edit = this.currentEdit;
                if (!this.isSaving && edit) {
                    this.isSaving = true;
                    this.songEditApi.approve(edit)
                        .then(function (results) { return _this.removeSongEdit(results.id); })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            ApproveSongEditsController.prototype.reject = function () {
                var _this = this;
                var edit = this.currentEdit;
                if (!this.isSaving && edit) {
                    this.isSaving = true;
                    this.songEditApi.reject(edit.id)
                        .then(function (result) {
                        if (result) {
                            _this.removeSongEdit(result.id);
                        }
                    })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            ApproveSongEditsController.prototype.removeSongEdit = function (editId) {
                this.pendingEdits = this.pendingEdits.filter(function (e) { return e.id !== editId; });
                if (this.currentEdit && this.currentEdit.id === editId) {
                    this.setCurrentEdit(this.pendingEdits[0]);
                }
            };
            ApproveSongEditsController.prototype.removeTag = function (tag) {
                if (this.currentEdit) {
                    var index = this.currentEdit.newTags.indexOf(tag);
                    if (index >= 0) {
                        this.currentEdit.newTags.splice(index, 1);
                    }
                }
            };
            ApproveSongEditsController.prototype.autoCompleteTagSelected = function (tag) {
                this.addTag(tag);
                this.tagsInput = "";
            };
            ApproveSongEditsController.prototype.addTag = function (tag) {
                if (this.currentEdit) {
                    var tagLowered = tag.toLowerCase().trim();
                    if (!this.currentEdit.newTags.includes(tagLowered) && tagLowered.length > 1) {
                        this.currentEdit.newTags.push(tagLowered);
                    }
                }
            };
            ApproveSongEditsController.prototype.tagsInputChanged = function () {
                var _this = this;
                // If the user typed a comma, add any existing tag
                if (this.tagsInput.includes(",")) {
                    var tags = this.tagsInput.split(",");
                    this.tagsInput = "";
                    tags
                        .filter(function (t) { return t && t.length > 1; })
                        .forEach(function (t) { return _this.addTag(t); });
                }
            };
            ApproveSongEditsController.prototype.tagsEnterKeyPressed = function () {
                if (this.tagsInput.length > 1) {
                    this.autoCompleteTagSelected(this.tagsInput);
                }
            };
            ApproveSongEditsController.prototype.searchTags = function (search) {
                return this.tagApi.searchTags(search);
            };
            return ApproveSongEditsController;
        }());
        ApproveSongEditsController.$inject = [
            "songApi",
            "songEditApi",
            "tagApi"
        ];
        Chavah.ApproveSongEditsController = ApproveSongEditsController;
        Chavah.App.controller("ApproveSongEditsController", ApproveSongEditsController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ConfirmEmailController = (function () {
            function ConfirmEmailController(accountApi, $routeParams) {
                var _this = this;
                this.accountApi = accountApi;
                this.email = "";
                this.confirmCode = "";
                this.isConfirming = true;
                this.confirmSucceeded = false;
                this.confirmFailed = false;
                this.confirmFailedErrorMessage = "";
                this.email = $routeParams["email"];
                // The confirm code is generated by WebAPI. We manually replace any forward slashes with triple underscore,
                // otherwise the Angular route gets busted, even with encodeURIComponent.
                var escapedConfirmCode = $routeParams["confirmCode"] || "";
                this.confirmCode = escapedConfirmCode.replace(new RegExp("___", "g"), "/"); // Put the forward slash(s) back in.
                setTimeout(function () { return _this.confirm(); }, 1000);
            }
            ConfirmEmailController.prototype.confirm = function () {
                var _this = this;
                this.accountApi.confirmEmail(this.email, this.confirmCode)
                    .then(function (results) { return _this.confirmEmailCompleted(results); })
                    .catch(function (results) { return _this.confirmEmailCompleted({
                    errorMessage: results && results.data && results.data.exceptionMessage ? results.data.exceptionMessage : "Couldn't confirm email",
                    success: false
                }); });
            };
            ConfirmEmailController.prototype.confirmEmailCompleted = function (results) {
                this.isConfirming = false;
                this.confirmSucceeded = results.success;
                this.confirmFailed = !this.confirmSucceeded;
                this.confirmFailedErrorMessage = results.errorMessage;
            };
            return ConfirmEmailController;
        }());
        ConfirmEmailController.$inject = [
            "accountApi",
            "$routeParams"
        ];
        Chavah.ConfirmEmailController = ConfirmEmailController;
        Chavah.App.controller("ConfirmEmailController", ConfirmEmailController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var CreatePasswordController = (function () {
            function CreatePasswordController(accountApi, appNav, $routeParams) {
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.password = "";
                this.showPasswordError = false;
                this.isSaving = false;
                this.hasCreatedPassword = false;
                this.email = $routeParams["email"];
                this.emailWithoutDomain = this.email.substr(0, this.email.indexOf('@'));
            }
            Object.defineProperty(CreatePasswordController.prototype, "isPasswordValid", {
                get: function () {
                    return this.password.length >= 6;
                },
                enumerable: true,
                configurable: true
            });
            CreatePasswordController.prototype.createPassword = function () {
                var _this = this;
                if (!this.isPasswordValid) {
                    this.showPasswordError = true;
                    return;
                }
                if (!this.isSaving) {
                    this.isSaving = true;
                    this.accountApi.createPassword(this.email, this.password)
                        .then(function () { return _this.hasCreatedPassword = true; })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            return CreatePasswordController;
        }());
        CreatePasswordController.minPasswordLength = 6;
        CreatePasswordController.$inject = [
            "accountApi",
            "appNav",
            "$routeParams"
        ];
        Chavah.CreatePasswordController = CreatePasswordController;
        Chavah.App.controller("CreatePasswordController", CreatePasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var DonateController = (function () {
            function DonateController(artistApi, $routeParams) {
                var _this = this;
                this.desiredArtistName = null;
                this.donationTargetOptions = [
                    "Chavah Messianic Radio",
                    "All artists on Chavah Messianic Radio"
                ];
                this.donationTarget = this.donationTargetOptions[0];
                this.selectedArtist = null;
                this.desiredArtistName = $routeParams["artist"];
                if (this.desiredArtistName) {
                    this.donationTargetOptions.push(this.desiredArtistName);
                    this.donationTarget = this.desiredArtistName;
                }
                artistApi.getAll("", 0, 1000)
                    .then(function (results) { return _this.allArtistsFetched(results.items); });
            }
            DonateController.prototype.allArtistsFetched = function (artists) {
                var artistNames = artists.map(function (a) { return a.name; });
                (_a = this.donationTargetOptions).push.apply(_a, artistNames);
                var _a;
            };
            return DonateController;
        }());
        DonateController.$inject = [
            "artistApi",
            "$routeParams"
        ];
        Chavah.DonateController = DonateController;
        Chavah.App.controller("DonateController", DonateController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditAlbumController = (function () {
            function EditAlbumController(albumApi, appNav, $routeParams, $q) {
                var _this = this;
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.$q = $q;
                this.album = null;
                this.allAlbumSwatches = [];
                this.hasChangedAlbumArt = false;
                // We allow the user to pass in:
                // - An album and artist: /#/admin/album/lamb/sacrifice
                // - An album ID: /#/admin/album/albums/221
                // - Nothing (will create a new album): /#/admin/album/create
                var artist = $routeParams["artist"];
                var album = $routeParams["album"];
                if (artist && album) {
                    var isAlbumId = artist.toLowerCase() === "albums";
                    if (isAlbumId) {
                        this.albumApi.get(artist + "/" + album)
                            .then(function (result) { return _this.albumLoaded(result); });
                    }
                    else {
                        this.albumApi.getByArtistAndAlbumName(artist, album)
                            .then(function (result) { return _this.albumLoaded(result); });
                    }
                }
                else {
                    this.createNewAlbum();
                }
            }
            EditAlbumController.prototype.createNewAlbum = function () {
                return new Chavah.Album({
                    albumArtUri: "",
                    artist: "[new artist]",
                    isVariousArtists: false,
                    backgroundColor: "",
                    foregroundColor: "",
                    mutedColor: "",
                    name: "[new album]",
                    id: "",
                    textShadowColor: "",
                    songCount: 0
                });
            };
            EditAlbumController.prototype.albumLoaded = function (album) {
                var _this = this;
                if (album) {
                    this.album = album;
                    if (album.albumArtUri) {
                        this.loadCanvasSafeAlbumArt(album.albumArtUri)
                            .then(function (img) { return _this.populateColorSwatches(img); });
                    }
                }
                else {
                    this.appNav.createAlbum();
                }
            };
            EditAlbumController.prototype.save = function () {
                var _this = this;
                if (this.album && !this.album.isSaving) {
                    this.album.isSaving = true;
                    var task;
                    if (this.hasChangedAlbumArt) {
                        // We must .save first to ensure we have an album ID.
                        this.albumApi.save(this.album)
                            .then(function (result) { return _this.albumApi.changeArt(result.id, _this.album.albumArtUri); })
                            .then(function (result) {
                            _this.album = result;
                            _this.hasChangedAlbumArt = false;
                        })
                            .finally(function () { return _this.album.isSaving = false; });
                    }
                    else {
                        this.albumApi.save(this.album)
                            .then(function (result) { return _this.album = result; })
                            .finally(function () { return _this.album.isSaving = false; });
                    }
                }
                return null;
            };
            EditAlbumController.prototype.hexToRgbString = function (hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (result && result.length >= 4) {
                    return "rgb(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ")";
                }
                return "";
            };
            EditAlbumController.prototype.resetColorSwatches = function (imgUrl) {
                var _this = this;
                this.loadCanvasSafeAlbumArt(imgUrl)
                    .then(function (img) { return _this.populateColorSwatches(img); });
            };
            EditAlbumController.prototype.chooseAlbumArt = function () {
                var _this = this;
                filepicker.setKey(Chavah.UploadAlbumController.filePickerKey);
                var options = {
                    extensions: [".jpg", ".png"]
                };
                filepicker.pick(options, function (result) { return _this.albumArtChosen(result); }, function (error) { return console.log("Album art pick failed.", error); });
            };
            EditAlbumController.prototype.albumArtChosen = function (albumArt) {
                var _this = this;
                this.hasChangedAlbumArt = true;
                if (this.album) {
                    this.album.albumArtUri = albumArt.url;
                }
                this.loadCanvasSafeAlbumArt(albumArt.url)
                    .then(function (img) { return _this.populateColorSwatches(img); });
            };
            EditAlbumController.prototype.populateColorSwatches = function (image) {
                if (this.album) {
                    var vibrant = new Vibrant(image, 64, 5);
                    var swatches = vibrant.swatches();
                    if (swatches) {
                        this.allAlbumSwatches = Chavah.UploadAlbumController.getFriendlySwatches(swatches);
                        if (!this.album.backgroundColor) {
                            this.album.backgroundColor = (swatches.DarkVibrant || swatches.DarkMuted || Chavah.Song.defaultSwatch).getHex();
                            this.album.foregroundColor = (swatches.LightVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getHex();
                            this.album.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getBodyTextColor();
                            this.album.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Chavah.Song.defaultSwatch).getHex();
                        }
                    }
                }
            };
            EditAlbumController.prototype.loadCanvasSafeAlbumArt = function (imgUrl) {
                if (!imgUrl) {
                    throw new Error("imgUrl must not be null or undefined");
                }
                var deferred = this.$q.defer();
                var img = document.createElement("img");
                img.src = "/api/albums/art/imageOnDomain?imageUrl=" + encodeURIComponent(imgUrl);
                img.addEventListener("load", function () {
                    deferred.resolve(img);
                });
                img.addEventListener("error", function () { return deferred.reject(); });
                return deferred.promise;
            };
            return EditAlbumController;
        }());
        EditAlbumController.$inject = [
            "albumApi",
            "appNav",
            "$routeParams",
            "$q"
        ];
        Chavah.EditAlbumController = EditAlbumController;
        Chavah.App.controller("EditAlbumController", EditAlbumController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditArtistController = (function () {
            function EditArtistController(artistApi, $routeParams, $scope) {
                var _this = this;
                this.artistApi = artistApi;
                this.$scope = $scope;
                var artistName = $routeParams["artistName"];
                if (artistName && artistName.length > 0) {
                    this.artistApi.getByName(artistName)
                        .then(function (result) { return _this.artist = result; });
                }
                else {
                    // Launched without an artist name. Create new.
                    this.artist = new Chavah.Artist();
                }
            }
            EditArtistController.prototype.removeImage = function (image) {
                if (this.artist) {
                    this.artist.images = this.artist.images.filter(function (i) { return i !== image; });
                }
            };
            EditArtistController.prototype.addImages = function () {
                var _this = this;
                filepicker.setKey(Chavah.UploadAlbumController.filePickerKey);
                var options = {
                    extensions: [".jpg", ".png"],
                    maxFiles: 100
                };
                filepicker.pickMultiple(options, function (result) { return _this.imagesAdded(result); }, function (error) { return console.log("Failed to add image.", error); });
            };
            EditArtistController.prototype.imagesAdded = function (images) {
                var _this = this;
                images.forEach(function (i) { return _this.artist.images.push(i.url); });
                this.$scope.$applyAsync();
            };
            EditArtistController.prototype.save = function () {
                var _this = this;
                if (this.artist && !this.artist.isSaving) {
                    this.artist.isSaving = true;
                    this.artistApi.save(this.artist)
                        .then(function (result) { return _this.artist.updateFrom(result); })
                        .finally(function () { return _this.artist.isSaving = false; });
                }
            };
            return EditArtistController;
        }());
        EditArtistController.$inject = [
            "artistApi",
            "$routeParams",
            "$scope"
        ];
        Chavah.EditArtistController = EditArtistController;
        Chavah.App.controller("EditArtistController", EditArtistController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var EditSongController = (function () {
            function EditSongController(songApi, songEditApi, tagApi, accountApi, appNav, $routeParams) {
                var _this = this;
                this.songApi = songApi;
                this.songEditApi = songEditApi;
                this.tagApi = tagApi;
                this.song = null;
                this.tagsInput = "";
                this.isSaving = false;
                this.isSaveSuccess = false;
                this.isSaveFail = false;
                this.tags = [];
                this.isLyricsFocused = true;
                this.tagPlaceholder = "piano, violin, male vocal, hebrew, psalms";
                if (!accountApi.isSignedIn) {
                    appNav.promptSignIn();
                }
                else {
                    var songId = "songs/" + $routeParams["id"];
                    if (songId) {
                        songApi.getSongById(songId)
                            .then(function (result) { return _this.songLoaded(result); });
                    }
                    this.isAdmin = !!accountApi.currentUser && accountApi.currentUser.isAdmin;
                }
            }
            EditSongController.prototype.searchTags = function (search) {
                return this.tagApi.searchTags(search);
            };
            EditSongController.prototype.songLoaded = function (song) {
                this.song = song;
                if (song) {
                    this.tags = song.tags || [];
                    if (this.tags.length > 0) {
                        this.tagPlaceholder = "";
                    }
                }
            };
            EditSongController.prototype.tagsInputChanged = function () {
                var _this = this;
                // If the user typed a comma, add any existing tag
                if (this.tagsInput.includes(",")) {
                    var tags = this.tagsInput.split(",");
                    this.tagsInput = "";
                    tags.filter(function (t) { return t && t.length > 1; }).forEach(function (t) { return _this.addTag(t); });
                }
            };
            EditSongController.prototype.removeTag = function (tag) {
                var tagIndex = this.tags.indexOf(tag);
                if (tagIndex >= 0) {
                    this.tags.splice(tagIndex, 1);
                }
            };
            EditSongController.prototype.autoCompleteTagSelected = function (tag) {
                this.addTag(tag);
                this.tagsInput = "";
            };
            EditSongController.prototype.addTag = function (tag) {
                var tagLowered = tag.toLowerCase().trim();
                if (!this.tags.includes(tagLowered) && tagLowered.length > 1) {
                    this.tags.push(tagLowered);
                    this.tagPlaceholder = "";
                }
            };
            EditSongController.prototype.tagsEnterKeyPressed = function () {
                if (this.tagsInput.length > 1) {
                    this.autoCompleteTagSelected(this.tagsInput);
                }
            };
            EditSongController.prototype.submit = function () {
                var _this = this;
                if (this.song && !this.isSaving) {
                    this.song.tags = this.tags;
                    this.isSaving = true;
                    this.songEditApi.submit(this.song)
                        .then(function () { return _this.isSaveSuccess = true; })
                        .catch(function (error) { return _this.isSaveFail = true; })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            return EditSongController;
        }());
        EditSongController.$inject = [
            "songApi",
            "songEditApi",
            "tagApi",
            "accountApi",
            "appNav",
            "$routeParams"
        ];
        Chavah.EditSongController = EditSongController;
        Chavah.App.controller("EditSongController", EditSongController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var FooterController = (function () {
            function FooterController(audioPlayer, songBatch, likeApi, songRequestApi, accountApi, stationIdentifier, appNav, $scope) {
                var _this = this;
                this.audioPlayer = audioPlayer;
                this.songBatch = songBatch;
                this.likeApi = likeApi;
                this.songRequestApi = songRequestApi;
                this.accountApi = accountApi;
                this.stationIdentifier = stationIdentifier;
                this.appNav = appNav;
                this.$scope = $scope;
                this.volumeShown = false;
                this.volume = 1;
                this.isBuffering = false;
                var audio = document.querySelector("#audio");
                this.audioPlayer.initialize(audio);
                this.volume = audio.volume;
                // Notify the scope when the audio status changes.
                this.audioPlayer.status
                    .debounce(100)
                    .subscribe(function (status) { return _this.audioStatusChanged(status); });
                // Update the track time. We don't use angular for this, because of the constant (per second) update.
                this.audioPlayer.playedTimeText
                    .distinctUntilChanged()
                    .subscribe(function (result) { return $(".footer .track-time").text(result); });
                this.audioPlayer.duration
                    .distinctUntilChanged()
                    .subscribe(function (result) { return $(".footer .track-duration").text(_this.getFormattedTime(result)); });
                this.audioPlayer.status
                    .distinctUntilChanged()
                    .subscribe(function (status) { return $(".footer .audio-status").text(_this.getAudioStatusText(status)); });
                this.audioPlayer.playedTimePercentage
                    .distinctUntilChanged()
                    .subscribe(function (percent) { return $(".footer .trackbar").width(percent + "%"); });
                $scope.$watch(function () { return _this.volume; }, function () { return audio.volume = _this.volume; });
                // MediaSession:
                // This is a new browser API being adopted on some mobile platforms (at the time of this writing, Android), 
                // which shows media information above the 
                // For more info, see https://developers.google.com/web/updates/2017/02/media-session#set_metadata
                if ('mediaSession' in navigator) {
                    // Setup media session handlers so that a native play/pause/next buttons do the same thing as our footer's play/pause/next.
                    this.setupMediaSessionHandlers();
                    // Listen for when the song changes so that we show the song info on the phone lock screen.
                    this.audioPlayer.song.subscribe(function (songOrNull) { return _this.updateMediaSession(songOrNull); });
                }
            }
            Object.defineProperty(FooterController.prototype, "likesCurrentSong", {
                get: function () {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong) {
                        return currentSong.songLike === Chavah.SongLike.Liked;
                    }
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "dislikesCurrentSong", {
                get: function () {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong) {
                        return currentSong.songLike === Chavah.SongLike.Disliked;
                    }
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "likeText", {
                get: function () {
                    if (this.likesCurrentSong) {
                        return "You have already liked this song. Chavah is playing it more often.";
                    }
                    return "Like this song. Chavah will play this song, and others like it, more often.";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "dislikeText", {
                get: function () {
                    if (this.dislikesCurrentSong) {
                        return "You have already disliked this song. Chavah is playing it less often.";
                    }
                    return "Dislike this song. Chavah will play this song, and others like it, less often.";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FooterController.prototype, "volumeIconClass", {
                get: function () {
                    if (this.volume > .95) {
                        return "fa-volume-up";
                    }
                    if (this.volume < .05) {
                        return "fa-volume-off";
                    }
                    return "fa-volume-down";
                },
                enumerable: true,
                configurable: true
            });
            FooterController.prototype.toggleVolumnShown = function () {
                this.volumeShown = !this.volumeShown;
            };
            FooterController.prototype.isPaused = function () {
                return this.audioPlayer.status.getValue() === Chavah.AudioStatus.Paused;
            };
            FooterController.prototype.playPause = function () {
                if (this.audioPlayer.status.getValue() === Chavah.AudioStatus.Playing) {
                    this.audioPlayer.pause();
                }
                else {
                    this.audioPlayer.resume();
                }
            };
            FooterController.prototype.dislikeSong = function () {
                if (this.requireSignIn()) {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong && currentSong.songLike !== Chavah.SongLike.Disliked) {
                        currentSong.songLike = Chavah.SongLike.Disliked;
                        this.likeApi.dislikeSong(currentSong.id)
                            .then(function (rank) { return currentSong.communityRank = rank; });
                        this.songBatch.playNext();
                    }
                }
            };
            FooterController.prototype.likeSong = function () {
                if (this.requireSignIn()) {
                    var currentSong = this.audioPlayer.song.getValue();
                    if (currentSong && currentSong.songLike !== Chavah.SongLike.Liked) {
                        currentSong.songLike = Chavah.SongLike.Liked;
                        this.likeApi.likeSong(currentSong.id)
                            .then(function (rank) { return currentSong.communityRank = rank; });
                    }
                }
            };
            FooterController.prototype.requestSong = function () {
                var _this = this;
                if (this.requireSignIn()) {
                    this.appNav.showSongRequestDialog()
                        .result.then(function (song) { return _this.songRequestDialogCompleted(song); });
                }
            };
            FooterController.prototype.requireSignIn = function () {
                if (this.accountApi.isSignedIn) {
                    return true;
                }
                else {
                    this.appNav.promptSignIn();
                    return false;
                }
            };
            FooterController.prototype.songRequestDialogCompleted = function (song) {
                var _this = this;
                if (song) {
                    this.audioPlayer.pause();
                    this.songRequestApi.requestSong(song)
                        .then(function () { return _this.playNextSong(); });
                }
            };
            FooterController.prototype.playNextSong = function () {
                this.audioPlayer.pause();
                // If we've got a song request, play that.
                if (this.songRequestApi.hasPendingRequest()) {
                    this.songRequestApi.playRequest();
                }
                else if (this.stationIdentifier.hasPendingAnnouncement()) {
                    // Play the station identifier if need be.
                    this.stationIdentifier.playStationIdAnnouncement();
                }
                else {
                    this.songBatch.playNext();
                }
            };
            FooterController.prototype.audioStatusChanged = function (status) {
                if (status === Chavah.AudioStatus.Ended) {
                    this.playNextSong();
                }
                this.isBuffering = status === Chavah.AudioStatus.Buffering || status === Chavah.AudioStatus.Stalled;
                this.$scope.$applyAsync();
            };
            FooterController.prototype.getFormattedTime = function (totalSeconds) {
                if (isNaN(totalSeconds)) {
                    return "00";
                }
                var minutes = Math.floor(totalSeconds / 60);
                var seconds = Math.floor(totalSeconds - (minutes * 60));
                var zeroPaddedSeconds = seconds < 10 ? "0" : "";
                return minutes + ":" + zeroPaddedSeconds + seconds;
            };
            FooterController.prototype.getAudioStatusText = function (status) {
                switch (status) {
                    case Chavah.AudioStatus.Aborted: return "Unable to play";
                    case Chavah.AudioStatus.Buffering: return "Buffering...";
                    case Chavah.AudioStatus.Ended: return "Ended...";
                    case Chavah.AudioStatus.Erred: return "Encountered an error";
                    case Chavah.AudioStatus.Paused: return "Paused";
                    case Chavah.AudioStatus.Playing: return "";
                    case Chavah.AudioStatus.Stalled: return "Stalled...";
                }
            };
            FooterController.prototype.setupMediaSessionHandlers = function () {
                var _this = this;
                try {
                    var mediaSession = navigator["mediaSession"];
                    mediaSession.setActionHandler("play", function () { return _this.playPause(); });
                    mediaSession.setActionHandler("pause", function () { return _this.playPause(); });
                    mediaSession.setActionHandler("nexttrack", function () { return _this.playNextSong(); });
                }
                catch (error) {
                    // Can't setup media session action handlers? No worries. Continue as normal.
                }
            };
            FooterController.prototype.updateMediaSession = function (song) {
                if (song) {
                    var metadata = {
                        album: song.album,
                        artist: song.artist,
                        title: song.name,
                        artwork: [
                            { src: song.albumArtUri, sizes: "300x300", type: "image/jpg" }
                        ]
                    };
                    try {
                        navigator["mediaSession"].metadata = new window["MediaMetadata"](metadata);
                    }
                    catch (error) {
                        // Can't update the media session? No worries; eat the error and proceed as normal.
                    }
                }
            };
            return FooterController;
        }());
        FooterController.$inject = [
            "audioPlayer",
            "songBatch",
            "likeApi",
            "songRequestApi",
            "accountApi",
            "stationIdentifier",
            "appNav",
            "$scope"
        ];
        Chavah.FooterController = FooterController;
        Chavah.App.controller("FooterController", FooterController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ForgotPasswordController = (function () {
            function ForgotPasswordController(accountApi) {
                this.accountApi = accountApi;
                this.email = "";
                this.resetPasswordSuccessfully = false;
                this.couldNotFindEmail = false;
                this.resetErrorMessage = "";
                this.isBusy = false;
            }
            Object.defineProperty(ForgotPasswordController.prototype, "registerUrl", {
                get: function () {
                    if (this.email && this.email.indexOf("@") >= 0) {
                        return "#/register/" + encodeURIComponent(this.email);
                    }
                    return "#/register";
                },
                enumerable: true,
                configurable: true
            });
            ForgotPasswordController.prototype.resetPassword = function () {
                var _this = this;
                var isValidEmail = this.email && this.email.includes("@");
                if (!isValidEmail) {
                    this.resetErrorMessage = "Please enter your email so we can reset your password";
                    return;
                }
                this.resetFields();
                if (!this.isBusy) {
                    this.isBusy = true;
                    this.accountApi.sendPasswordResetEmail(this.email)
                        .then(function (results) { return _this.passwordResetCompleted(results); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            ForgotPasswordController.prototype.passwordResetCompleted = function (result) {
                if (result.success) {
                    this.resetPasswordSuccessfully = true;
                }
                else if (result.invalidEmail) {
                    this.couldNotFindEmail = true;
                }
                else {
                    this.resetErrorMessage = result.errorMessage || "Unable to reset password";
                }
            };
            ForgotPasswordController.prototype.resetFields = function () {
                this.couldNotFindEmail = false;
                this.resetPasswordSuccessfully = false;
                this.resetErrorMessage = "";
            };
            return ForgotPasswordController;
        }());
        ForgotPasswordController.$inject = [
            "accountApi"
        ];
        Chavah.ForgotPasswordController = ForgotPasswordController;
        Chavah.App.controller("ForgotPasswordController", ForgotPasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HeaderController = (function () {
            function HeaderController(initConfig, accountApi, $timeout) {
                var _this = this;
                this.initConfig = initConfig;
                this.accountApi = accountApi;
                this.$timeout = $timeout;
                this.isNotificationPopoverOpened = false;
                this.notifications = initConfig.notifications;
                $timeout(function () { return _this.encourageUserToViewNotifications(); }, 15000);
            }
            Object.defineProperty(HeaderController.prototype, "currentUserName", {
                get: function () {
                    return this.accountApi.currentUser ? this.accountApi.currentUser.email : "";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(HeaderController.prototype, "unreadNotificationCount", {
                get: function () {
                    return this.notifications.filter(function (n) { return n.isUnread; }).length;
                },
                enumerable: true,
                configurable: true
            });
            HeaderController.prototype.encourageUserToViewNotifications = function () {
                // If the user has some notifications, and some of them are unread, encourage the user to view them.
                // Adding this functionality because we've found a great many users never click the notifications button.
                if (this.notifications.length > 0 && this.notifications.some(function (n) { return n.isUnread; })) {
                    this.isNotificationPopoverOpened = true;
                }
            };
            HeaderController.prototype.markNotificationsAsRead = function () {
                if (this.notifications.some(function (n) { return n.isUnread; })) {
                    this.notifications.forEach(function (n) { return n.isUnread = false; });
                    this.accountApi.clearNotifications();
                }
                this.isNotificationPopoverOpened = false;
            };
            HeaderController.prototype.signOut = function () {
                this.accountApi.signOut()
                    .then(function () { return window.location.reload(); });
            };
            return HeaderController;
        }());
        HeaderController.$inject = [
            "initConfig",
            "accountApi",
            "$timeout"
        ];
        Chavah.HeaderController = HeaderController;
        Chavah.App.controller("HeaderController", HeaderController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var LogEditorController = (function () {
            function LogEditorController(logApi) {
                var _this = this;
                this.logApi = logApi;
                this.logs = new Chavah.PagedList(function (skip, take) { return _this.logApi.getAll(skip, take); });
                this.isSaving = false;
                this.logs.fetchNextChunk();
            }
            LogEditorController.prototype.getTimeAgo = function (dateIso) {
                return moment(dateIso).fromNow(false);
            };
            LogEditorController.prototype.getFriendlyDate = function (dateIso) {
                return moment(dateIso).utcOffset(-6).format("dddd MMMM DD, YYYY h:mma") + " (CST)";
            };
            LogEditorController.prototype.deleteLog = function (log) {
                var _this = this;
                if (!this.isSaving) {
                    this.isSaving = true;
                    this.logApi.deleteLog(log.id)
                        .then(function () { return _this.logs.resetAndFetch(); })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            LogEditorController.prototype.getOccurrencesText = function (log) {
                if (log.occurrences && log.occurrences.length) {
                    return log.occurrences.map(function (o) { return JSON.stringify(o, null, 4); });
                }
                return [];
            };
            return LogEditorController;
        }());
        LogEditorController.$inject = ["logApi"];
        Chavah.LogEditorController = LogEditorController;
        Chavah.App.controller("LogEditorController", LogEditorController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var NowPlayingController = (function () {
            function NowPlayingController(songApi, songBatch, audioPlayer, albumCache, initConfig, appNav, accountApi, $q) {
                var _this = this;
                this.songApi = songApi;
                this.songBatch = songBatch;
                this.audioPlayer = audioPlayer;
                this.albumCache = albumCache;
                this.initConfig = initConfig;
                this.appNav = appNav;
                this.accountApi = accountApi;
                this.$q = $q;
                this.songs = [];
                this.trending = [];
                this.recent = [];
                this.popular = [];
                this.likes = [];
                this.isFetchingAlbums = false;
                this.disposed = new Rx.Subject();
                this.audioPlayer.song.takeUntil(this.disposed).subscribeOnNext(function (song) { return _this.nextSongBeginning(song); });
                this.audioPlayer.songCompleted.takeUntil(this.disposed).throttle(5000).subscribe(function (song) { return _this.songCompleted(song); });
                this.songBatch.songsBatch.takeUntil(this.disposed).subscribeOnNext(function () { return _this.songs = _this.getSongs(); });
                // Recent plays we fetch once, at init. Afterwards, we update it ourselves.
                this.fetchRecentPlays();
                this.setupRecurringFetches();
                if (initConfig.embed) {
                    // If we're embedded on another page, queue up the song we're told to play.
                    // Don't play it automatically, though, because there may be multiple embeds on the same page.
                }
                else {
                    // Play the next song if we don't already have one playing.
                    // We don't have one playing when first loading the UI.
                    var hasCurrentSong = this.audioPlayer.song.getValue();
                    if (!hasCurrentSong) {
                        if (!this.playSongInUrlQuery()) {
                            this.songBatch.playNext();
                        }
                    }
                }
            }
            Object.defineProperty(NowPlayingController.prototype, "currentArtistDonateUrl", {
                get: function () {
                    var song = this.currentSong;
                    if (song && song.artist) {
                        return "#/donate/" + encodeURIComponent(song.artist);
                    }
                    return "#/donate";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(NowPlayingController.prototype, "currentSongShareUrl", {
                get: function () {
                    if (this.currentSong) {
                        if (this.currentSong.isShowingEmbedCode) {
                            return this.currentSong.getEmbedCode();
                        }
                        return this.currentSong.shareUrl;
                    }
                    return "";
                },
                enumerable: true,
                configurable: true
            });
            NowPlayingController.prototype.getEditSongUrl = function () {
                if (this.currentSong) {
                    if (this.accountApi.isSignedIn) {
                        return this.appNav.getEditSongUrl(this.currentSong.id);
                    }
                    return this.appNav.promptSignInUrl;
                }
                return "#";
            };
            NowPlayingController.prototype.$onDestroy = function () {
                if (this.recurringFetchHandle) {
                    clearTimeout(this.recurringFetchHandle);
                }
                this.disposed.onNext(true);
            };
            NowPlayingController.prototype.getSongs = function () {
                var songs = [
                    this.audioPlayer.song.getValue(),
                    this.songBatch.songsBatch.getValue()[0],
                    this.songBatch.songsBatch.getValue()[1],
                    this.songBatch.songsBatch.getValue()[2],
                    this.songBatch.songsBatch.getValue()[3]
                ].filter(function (s) { return !!s && s.name; });
                this.fetchAlbumColors(songs);
                return songs;
            };
            NowPlayingController.prototype.getSongOrPlaceholder = function (song) {
                return song || Chavah.Song.empty();
            };
            NowPlayingController.prototype.fetchAlbumColors = function (songs) {
                var _this = this;
                var songsNeedingAlbumSwatch = songs
                    .filter(function (s) { return !s.hasSetAlbumArtColors && s.id !== "songs/0"; });
                if (songsNeedingAlbumSwatch.length > 0) {
                    this.isFetchingAlbums = true;
                    this.albumCache.getAlbumsForSongs(songsNeedingAlbumSwatch)
                        .then(function (albums) { return _this.populateSongsWithAlbumColors(albums); });
                }
            };
            NowPlayingController.prototype.populateSongsWithAlbumColors = function (albums) {
                var _this = this;
                albums.forEach(function (a) {
                    var songsForAlbum = _this.getAllSongsOnScreen().filter(function (s) { return s.albumId && s.albumId.toLowerCase() === a.id.toLowerCase(); });
                    songsForAlbum.forEach(function (s) { return s.updateAlbumArtColors(a); });
                });
            };
            NowPlayingController.prototype.setupRecurringFetches = function () {
                var _this = this;
                var songFetchesTask = this.songApi.getTrendingSongs(0, 3)
                    .then(function (results) { return _this.updateSongList(_this.trending, results.items); })
                    .then(function () { return _this.songApi.getPopularSongs(3); })
                    .then(function (results) { return _this.updateSongList(_this.popular, results); })
                    .then(function () { return _this.songApi.getLikes(3); })
                    .then(function (results) { return _this.updateSongList(_this.likes, results); })
                    .finally(function () {
                    _this.fetchAlbumColors(_this.getAllSongsOnScreen());
                    // Call ourselves every 30s.
                    _this.recurringFetchHandle = setTimeout(function () { return _this.setupRecurringFetches(); }, 30000);
                });
            };
            NowPlayingController.prototype.fetchRecentPlays = function () {
                var _this = this;
                this.songApi.getRecentPlays(3)
                    .then(function (results) {
                    results.forEach(function (s) { return _this.recent.push(s); });
                    if (_this.recent.length > 3) {
                        _this.recent.length = 3;
                    }
                });
            };
            NowPlayingController.prototype.updateSongList = function (target, source) {
                target.splice.apply(target, [0, target.length].concat(source));
                this.fetchAlbumColors(this.getAllSongsOnScreen());
            };
            NowPlayingController.prototype.getAllSongsOnScreen = function () {
                return this.songs.concat(this.recent, this.trending, this.likes, this.popular);
            };
            NowPlayingController.prototype.nextSongBeginning = function (song) {
                this.songs = this.getSongs();
                if (song) {
                    if (this.currentSong) {
                        this.recent.splice(0, 0, this.currentSong);
                        if (this.recent.length > 3) {
                            this.recent.length = 3;
                        }
                    }
                    this.currentSong = song;
                }
            };
            NowPlayingController.prototype.songCompleted = function (song) {
                if (song) {
                    this.songApi.songCompleted(song.id);
                }
            };
            NowPlayingController.prototype.songClicked = function (song) {
                if (song !== this.currentSong) {
                    song.setSolePickReason(Chavah.SongPick.YouRequestedSong);
                    var songBatch = this.songBatch.songsBatch.getValue();
                    var songIndex = songBatch.indexOf(song);
                    if (songIndex >= 0) {
                        songBatch.splice(songIndex, 1);
                        songBatch.splice(0, 0, song);
                        this.songBatch.playNext();
                    }
                }
            };
            NowPlayingController.prototype.playSongFromCurrentArtist = function () {
                if (this.currentSong) {
                    this.audioPlayer.playSongFromArtist(this.currentSong.artist);
                }
            };
            NowPlayingController.prototype.playSongFromCurrentAlbum = function () {
                if (this.currentSong) {
                    this.audioPlayer.playSongFromAlbum(this.currentSong.album);
                }
            };
            NowPlayingController.prototype.playSongWithTag = function (tag) {
                this.audioPlayer.playSongWithTag(tag);
            };
            NowPlayingController.prototype.playSongInUrlQuery = function () {
                // Does the user want us to play a certain song/album/artist?
                var songId = this.getUrlQueryOrNull("song");
                if (songId) {
                    this.audioPlayer.playSongById(songId);
                    return true;
                }
                var artist = this.getUrlQueryOrNull("artist");
                var album = this.getUrlQueryOrNull("album");
                if (artist && album) {
                    this.audioPlayer.playSongFromArtistAndAlbum(artist, album);
                    return true;
                }
                if (album) {
                    this.audioPlayer.playSongFromAlbum(album);
                    return true;
                }
                if (artist) {
                    this.audioPlayer.playSongFromArtist(artist);
                    return true;
                }
                return false;
            };
            NowPlayingController.prototype.copyShareUrl = function () {
                var shareUrlInput = document.querySelector("#currentSongShareLink");
                shareUrlInput.select();
                document.execCommand("copy");
            };
            NowPlayingController.prototype.getUrlQueryOrNull = function (term) {
                var queryString = window.location.search;
                if (queryString) {
                    var allTerms = queryString.split("&");
                    var termWithEquals = term + "=";
                    var termAtBeginning = "?" + termWithEquals;
                    var match = allTerms.find(function (t) { return t.startsWith(termWithEquals) || t.startsWith(termAtBeginning); });
                    if (match) {
                        var termValue = match.substr(match.indexOf("=") + 1);
                        if (termValue) {
                            var termValueWithoutPlus = termValue.split("+").join(" "); // Replace + with space.
                            return decodeURIComponent(termValueWithoutPlus);
                        }
                    }
                }
                return null;
            };
            return NowPlayingController;
        }());
        NowPlayingController.$inject = [
            "songApi",
            "songBatch",
            "audioPlayer",
            "albumCache",
            "initConfig",
            "appNav",
            "accountApi",
            "$q"
        ];
        Chavah.NowPlayingController = NowPlayingController;
        Chavah.App.controller("NowPlayingController", NowPlayingController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var PasswordController = (function () {
            function PasswordController(accountApi, appNav, $routeParams, $timeout, $scope) {
                var _this = this;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.$timeout = $timeout;
                this.email = "";
                this.showPasswordError = false;
                this.passwordError = "";
                this.isBusy = false;
                this.password = "";
                this.staySignedIn = true;
                this.signInSuccessful = false;
                this.email = $routeParams["email"];
                $scope.$watch(function () { return _this.password; }, function () { return _this.passwordChanged(); });
            }
            Object.defineProperty(PasswordController.prototype, "isPasswordValid", {
                get: function () {
                    return this.password.length >= 6;
                },
                enumerable: true,
                configurable: true
            });
            PasswordController.prototype.signIn = function () {
                var _this = this;
                if (!this.isPasswordValid) {
                    this.showPasswordError = true;
                    this.passwordError = "Passwords must be at least 6 characters long.";
                    return;
                }
                if (!this.isBusy) {
                    this.isBusy = true;
                    this.accountApi.signIn(this.email, this.password, this.staySignedIn)
                        .then(function (result) { return _this.signInCompleted(result); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            PasswordController.prototype.signInCompleted = function (result) {
                var _this = this;
                if (result.status === Chavah.SignInStatus.Success) {
                    this.signInSuccessful = true;
                    this.$timeout(function () { return _this.appNav.nowPlaying(); }, 2000);
                }
                else if (result.status === Chavah.SignInStatus.LockedOut) {
                    this.showPasswordError = true;
                    this.passwordError = "Your account is locked out. Please contact judahgabriel@gmail.com";
                }
                else if (result.status === Chavah.SignInStatus.RequiresVerification) {
                    this.showPasswordError = true;
                    this.passwordError = "Please check your email. We've sent you an email with a link to confirm your account.";
                }
                else if (result.status === Chavah.SignInStatus.Failure) {
                    this.showPasswordError = true;
                    this.passwordError = "Incorrect password";
                }
            };
            PasswordController.prototype.passwordChanged = function () {
                this.showPasswordError = false;
                this.passwordError = "";
            };
            return PasswordController;
        }());
        PasswordController.$inject = [
            "accountApi",
            "appNav",
            "$routeParams",
            "$timeout",
            "$scope"
        ];
        Chavah.PasswordController = PasswordController;
        Chavah.App.controller("PasswordController", PasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var RegisterController = (function () {
            function RegisterController(accountApi, $routeParams) {
                this.accountApi = accountApi;
                this.email = "";
                this.password = "";
                this.showEmailError = false;
                this.showPasswordError = false;
                this.showRegisterSuccess = false;
                this.showAlreadyRegistered = false;
                this.showNeedsConfirmation = false;
                this.registrationError = "";
                this.isBusy = false;
                var routeEmail = $routeParams["email"];
                if (routeEmail) {
                    this.email = routeEmail;
                }
            }
            Object.defineProperty(RegisterController.prototype, "isValidEmail", {
                get: function () {
                    return !!this.email && this.email.lastIndexOf("@") >= 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "isValidPassword", {
                get: function () {
                    return !!this.password && this.password.length >= 6;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(RegisterController.prototype, "showRegisterForm", {
                get: function () {
                    return !this.showAlreadyRegistered && !this.showNeedsConfirmation && !this.showRegisterSuccess;
                },
                enumerable: true,
                configurable: true
            });
            RegisterController.prototype.register = function () {
                var _this = this;
                this.reset();
                if (!this.isValidEmail) {
                    this.showEmailError = true;
                    return;
                }
                if (!this.isValidPassword) {
                    this.showPasswordError = true;
                    return;
                }
                if (!this.isBusy) {
                    this.isBusy = true;
                    this.accountApi.register(this.email, this.password)
                        .then(function (results) { return _this.registrationCompleted(results); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            RegisterController.prototype.registrationCompleted = function (results) {
                if (results.success) {
                    this.showRegisterSuccess = true;
                }
                else if (results.needsConfirmation) {
                    this.showNeedsConfirmation = true;
                }
                else if (results.isAlreadyRegistered) {
                    this.showAlreadyRegistered = true;
                }
                else {
                    this.registrationError = results.errorMessage || "Unable to register your user. Please contact judahgabriel@gmail.com";
                }
            };
            RegisterController.prototype.reset = function () {
                this.registrationError = "";
                this.showAlreadyRegistered = false;
                this.showEmailError = false;
                this.showNeedsConfirmation = false;
                this.showPasswordError = false;
                this.showRegisterSuccess = false;
            };
            return RegisterController;
        }());
        RegisterController.$inject = [
            "accountApi",
            "$routeParams"
        ];
        Chavah.RegisterController = RegisterController;
        Chavah.App.controller("RegisterController", RegisterController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var RequestSongController = (function () {
            function RequestSongController(songApi, $uibModalInstance, $q) {
                this.songApi = songApi;
                this.$uibModalInstance = $uibModalInstance;
                this.$q = $q;
                this.songRequestText = "";
            }
            RequestSongController.prototype.getSongMatches = function (searchText) {
                var maxSongResults = 10;
                var deferred = this.$q.defer();
                this.songApi.getSongMatches(searchText)
                    .then(function (results) { return deferred.resolve(results.slice(0, maxSongResults)); })
                    .catch(function (error) { return deferred.reject(error); });
                return deferred.promise;
            };
            RequestSongController.prototype.songChosen = function (song) {
                this.selectedSongRequest = song;
            };
            RequestSongController.prototype.requestSelectedSong = function () {
                if (this.selectedSongRequest) {
                    this.$uibModalInstance.close(this.selectedSongRequest);
                }
            };
            RequestSongController.prototype.close = function () {
                this.$uibModalInstance.close(null);
            };
            return RequestSongController;
        }());
        RequestSongController.$inject = [
            "songApi",
            "$uibModalInstance",
            "$q"
        ];
        Chavah.RequestSongController = RequestSongController;
        Chavah.App.controller("RequestSongController", RequestSongController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ResetPasswordController = (function () {
            function ResetPasswordController(accountApi, $routeParams) {
                this.accountApi = accountApi;
                this.$routeParams = $routeParams;
                this.email = "";
                this.password = "";
                this.showPasswordError = false;
                this.isBusy = false;
                this.passwordResetSucccessful = false;
                this.passwordResetFailed = false;
                this.passwordResetFailedMessage = "";
                this.email = $routeParams["email"];
                var rawConfirmCode = $routeParams["confirmCode"];
                // The confirm code is generated by WebAPI. We manually replace any forward slashes with triple underscore,
                // otherwise the Angular route gets busted, even with encodeURIComponent.
                var escapedConfirmCode = $routeParams["confirmCode"] || "";
                this.confirmCode = escapedConfirmCode.replace(new RegExp("___", "g"), "/"); // Put the forward slash(s) back in.
            }
            Object.defineProperty(ResetPasswordController.prototype, "isValidPassword", {
                get: function () {
                    return !!this.password && this.password.length >= 6;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ResetPasswordController.prototype, "showChangePasswordForm", {
                get: function () {
                    return !this.passwordResetSucccessful && !this.passwordResetFailed;
                },
                enumerable: true,
                configurable: true
            });
            ResetPasswordController.prototype.changePassword = function () {
                var _this = this;
                if (!this.isValidPassword) {
                    this.showPasswordError = true;
                    return;
                }
                if (!this.isBusy) {
                    this.resetValidationStates();
                    this.isBusy = true;
                    this.accountApi.resetPassword(this.email, this.confirmCode, this.password)
                        .then(function (results) { return _this.passwordResetCompleted(results); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            ResetPasswordController.prototype.passwordResetCompleted = function (result) {
                if (result.success) {
                    this.passwordResetSucccessful = true;
                }
                else {
                    this.passwordResetFailed = true;
                    this.passwordResetFailedMessage = result.errorMessage;
                }
            };
            ResetPasswordController.prototype.resetValidationStates = function () {
                this.passwordResetFailed = false;
                this.passwordResetFailedMessage = "";
                this.passwordResetSucccessful = false;
                this.showPasswordError = false;
            };
            return ResetPasswordController;
        }());
        ResetPasswordController.$inject = [
            "accountApi",
            "$routeParams"
        ];
        Chavah.ResetPasswordController = ResetPasswordController;
        Chavah.App.controller("ResetPasswordController", ResetPasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var ShareThanksController = (function () {
            function ShareThanksController($routeParams) {
                this.artist = $routeParams["artist"];
            }
            Object.defineProperty(ShareThanksController.prototype, "donateUrl", {
                get: function () {
                    if (this.artist) {
                        return "#/donate/" + encodeURIComponent(this.artist);
                    }
                    return "#/donate";
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(ShareThanksController.prototype, "donateText", {
                get: function () {
                    if (this.artist) {
                        return "Donate to " + this.artist;
                    }
                    return "Donate to the artists";
                },
                enumerable: true,
                configurable: true
            });
            return ShareThanksController;
        }());
        ShareThanksController.$inject = [
            "$routeParams"
        ];
        Chavah.ShareThanksController = ShareThanksController;
        Chavah.App.controller("ShareThanksController", ShareThanksController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SignInController = (function () {
            function SignInController(accountApi, appNav, $scope) {
                var _this = this;
                this.accountApi = accountApi;
                this.appNav = appNav;
                this.email = "";
                this.showEmailError = false;
                this.showUserNotInSystem = false;
                this.isBusy = false;
                $scope.$watch(function () { return _this.email; }, function () { return _this.showUserNotInSystem = false; });
            }
            Object.defineProperty(SignInController.prototype, "registerUrl", {
                get: function () {
                    if (this.email && this.email.indexOf("@") >= 0) {
                        return "#/register/" + this.email;
                    }
                    return "#/register";
                },
                enumerable: true,
                configurable: true
            });
            SignInController.prototype.checkEmail = function () {
                var _this = this;
                if (!this.email) {
                    this.showEmailError = true;
                }
                else if (!this.isBusy) {
                    this.resetValidationStates();
                    this.isBusy = true;
                    this.accountApi.getUserWithEmail(this.email)
                        .then(function (result) { return _this.userFetched(result); })
                        .finally(function () { return _this.isBusy = false; });
                }
            };
            SignInController.prototype.userFetched = function (user) {
                if (user == null) {
                    // If we didn't find a user, that means we need to redirect to the register account to create a new user.
                    this.showUserNotInSystem = true;
                }
                else if (user.requiresPasswordReset) {
                    // If we require password reset (e.g. they're imported from the 
                    // old system and haven't created a new password yet), redirect to the create password page.
                    this.appNav.createPassword(this.email);
                }
                else {
                    // We have a user that's ready to go.
                    this.appNav.password(this.email);
                }
            };
            SignInController.prototype.resetValidationStates = function () {
                this.showUserNotInSystem = false;
                this.showEmailError = false;
            };
            return SignInController;
        }());
        SignInController.$inject = [
            "accountApi",
            "appNav",
            "$scope"
        ];
        Chavah.SignInController = SignInController;
        Chavah.App.controller("SignInController", SignInController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongEditApprovedController = (function () {
            function SongEditApprovedController($routeParams) {
                this.artist = $routeParams["artist"];
                this.songName = $routeParams["songName"];
            }
            return SongEditApprovedController;
        }());
        SongEditApprovedController.$inject = [
            "$routeParams"
        ];
        Chavah.SongEditApprovedController = SongEditApprovedController;
        Chavah.App.controller("SongEditApprovedController", SongEditApprovedController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SongListController = (function () {
            function SongListController(audioPlayer) {
                this.audioPlayer = audioPlayer;
            }
            SongListController.prototype.playSong = function (song) {
                // Clone the song so that we assign a new clientId for tracking separately in ng repeaters.
                var clone = new Chavah.Song(song);
                clone.setSolePickReason(Chavah.SongPick.YouRequestedSong);
                this.audioPlayer.playNewSong(clone);
            };
            return SongListController;
        }());
        SongListController.$inject = [
            "audioPlayer"
        ];
        Chavah.SongListController = SongListController;
        Chavah.App.controller("SongListController", SongListController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TagEditorController = (function () {
            function TagEditorController(tagApi) {
                var _this = this;
                this.tagApi = tagApi;
                this.allTags = [];
                this.selectedTag = null;
                this.newTagName = "";
                this.isSaving = false;
                this.tagApi.getAll()
                    .then(function (results) { return _this.allTags = results.sort(); });
            }
            TagEditorController.prototype.selectTag = function (tag) {
                this.newTagName = tag || "";
                this.selectedTag = tag;
            };
            TagEditorController.prototype.deleteTag = function (tag) {
                var _this = this;
                if (!this.isSaving) {
                    this.isSaving = true;
                    this.tagApi.deleteTag(tag)
                        .then(function () {
                        _.pull(_this.allTags, tag);
                        _this.selectTag(null);
                    })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            TagEditorController.prototype.renameTag = function (oldTag) {
                var _this = this;
                var newTagName = this.newTagName;
                if (!this.isSaving && newTagName !== oldTag) {
                    this.isSaving = true;
                    this.tagApi.renameTag(oldTag, newTagName)
                        .then(function (result) {
                        var oldTagIndex = _this.allTags.indexOf(oldTag);
                        if (oldTagIndex >= 0) {
                            _this.allTags[oldTagIndex] = result;
                            _this.allTags = _.uniq(_this.allTags);
                        }
                        _this.selectTag(newTagName);
                    })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            return TagEditorController;
        }());
        TagEditorController.$inject = ["tagApi"];
        Chavah.TagEditorController = TagEditorController;
        Chavah.App.controller("TagEditorController", TagEditorController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var TrendingController = (function () {
            function TrendingController(songApi, albumCache, audioPlayer) {
                var _this = this;
                this.songApi = songApi;
                this.albumCache = albumCache;
                this.audioPlayer = audioPlayer;
                this.songsList = new Chavah.PagedList(function (skip, take) { return _this.songApi.getTrendingSongs(skip, take); }, undefined, function (items) { return _this.calcVisibleSongs(items); });
                this.visibleSongs = [];
                this.visibleStart = 0;
                this.songsList.fetchNextChunk();
            }
            Object.defineProperty(TrendingController.prototype, "canGoPrevious", {
                get: function () {
                    return this.visibleStart > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(TrendingController.prototype, "canGoNext", {
                get: function () {
                    return this.songsList.itemsTotalCount !== null && this.visibleStart < (this.songsList.itemsTotalCount - 1);
                },
                enumerable: true,
                configurable: true
            });
            TrendingController.prototype.calcVisibleSongs = function (items) {
                return __awaiter(this, void 0, void 0, function () {
                    var albums;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.visibleSongs = items.slice(this.visibleStart, this.visibleStart + TrendingController.maxVisibleSongs);
                                if (this.visibleSongs.length < TrendingController.maxVisibleSongs) {
                                    this.songsList.fetchNextChunk();
                                }
                                return [4 /*yield*/, this.albumCache.getAlbumsForSongs(this.visibleSongs)];
                            case 1:
                                albums = _a.sent();
                                this.visibleSongs.forEach(function (s) {
                                    var albumForSong = albums.find(function (a) { return a.artist === s.artist && a.name === s.album; });
                                    if (albumForSong) {
                                        s.updateAlbumArtColors(albumForSong);
                                    }
                                });
                                return [2 /*return*/];
                        }
                    });
                });
            };
            TrendingController.prototype.next = function () {
                if (this.canGoNext) {
                    this.visibleStart++;
                    this.calcVisibleSongs(this.songsList.items);
                }
            };
            TrendingController.prototype.previous = function () {
                if (this.canGoPrevious) {
                    this.visibleStart--;
                    this.calcVisibleSongs(this.songsList.items);
                }
            };
            TrendingController.prototype.playSong = function (song) {
                this.audioPlayer.playSongById(song.id);
            };
            return TrendingController;
        }());
        TrendingController.maxVisibleSongs = 5;
        TrendingController.$inject = [
            "songApi",
            "albumCache",
            "audioPlayer"
        ];
        Chavah.TrendingController = TrendingController;
        Chavah.App.controller("TrendingController", TrendingController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var UploadAlbumController = (function () {
            function UploadAlbumController(artistApi, albumApi, appNav, $scope, $sce) {
                var _this = this;
                this.albumApi = albumApi;
                this.appNav = appNav;
                this.$scope = $scope;
                this.$sce = $sce;
                this.albumName = "";
                this.songs = [];
                this.isUploading = false;
                this.albumArt = null;
                this.purchaseUrl = "";
                this.genre = "";
                this.allGenres = ["Messianic Jewish", "Hebrew Roots", "Jewish Christian", "Jewish", "Christian"];
                this.artist = null;
                this.allArtists = [];
                this.foreColor = Chavah.Song.defaultSwatch.getBodyTextColor();
                this.backColor = Chavah.Song.defaultSwatch.getHex();
                this.mutedColor = Chavah.Song.defaultSwatch.getHex();
                this.textShadowColor = Chavah.Song.defaultSwatch.getBodyTextColor();
                this.allAlbumSwatches = [];
                artistApi.getAll().then(function (results) { return _this.allArtists = results.items; });
            }
            UploadAlbumController.prototype.chooseSongs = function () {
                var _this = this;
                filepicker.setKey(UploadAlbumController.filePickerKey);
                var options = {
                    extension: ".mp3"
                };
                filepicker.pickMultiple(options, function (results) { return _this.songsChosen(results); }, function (error) { return console.log("Upload failed.", error); });
            };
            UploadAlbumController.prototype.songsChosen = function (songs) {
                var _this = this;
                songs.forEach(function (s) {
                    s["trustedUrl"] = _this.$sce.trustAsResourceUrl(s.url);
                    s["friendlyName"] = UploadAlbumController.songNameFromFileName(s.filename);
                });
                // Order the songs according to file name. If named right, it should order them correctly.
                songs.sort(function (a, b) { return a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0; });
                this.songs = this.songs.concat(songs);
                this.$scope.$applyAsync();
            };
            UploadAlbumController.prototype.chooseAlbumArt = function () {
                var _this = this;
                filepicker.setKey(UploadAlbumController.filePickerKey);
                var options = {
                    extensions: [".jpg", ".png"]
                };
                filepicker.pick(options, function (result) { return _this.albumArtChosen(result); }, function (error) { return console.log("Album art pick failed.", error); });
            };
            UploadAlbumController.prototype.albumArtChosen = function (albumArt) {
                this.albumArt = albumArt;
                this.fetchAlbumColorSwatches(albumArt);
                this.$scope.$applyAsync();
            };
            UploadAlbumController.prototype.fetchAlbumColorSwatches = function (albumArt) {
                var _this = this;
                if (albumArt.url) {
                    var img = document.createElement("img");
                    img.src = "/api/albums/art/imageOnDomain?imageUrl=" + encodeURIComponent(albumArt.url);
                    img.addEventListener("load", function () {
                        var vibrant = new Vibrant(img, 64, 5);
                        var swatches = vibrant.swatches();
                        if (swatches) {
                            _this.allAlbumSwatches = UploadAlbumController.getFriendlySwatches(swatches);
                            _this.backColor = (swatches.DarkVibrant || swatches.DarkMuted || Chavah.Song.defaultSwatch).getHex();
                            _this.foreColor = (swatches.LightVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getHex();
                            _this.mutedColor = (swatches.DarkMuted || swatches.DarkVibrant || swatches.Vibrant || Chavah.Song.defaultSwatch).getBodyTextColor();
                            _this.textShadowColor = (swatches.DarkMuted || swatches.DarkVibrant || Chavah.Song.defaultSwatch).getHex();
                            _this.$scope.$applyAsync();
                        }
                    });
                }
            };
            UploadAlbumController.prototype.moveSongUp = function (song) {
                var currentIndex = this.songs.indexOf(song);
                if (currentIndex > 0) {
                    var newIndex = currentIndex - 1;
                    this.songs.splice(currentIndex, 1);
                    this.songs.splice(newIndex, 0, song);
                }
            };
            UploadAlbumController.prototype.moveSongDown = function (song) {
                var currentIndex = this.songs.indexOf(song);
                if (currentIndex < (this.songs.length - 1)) {
                    var newIndex = currentIndex + 1;
                    this.songs.splice(currentIndex, 1);
                    this.songs.splice(newIndex, 0, song);
                }
            };
            UploadAlbumController.prototype.removeSong = function (song) {
                var index = this.songs.indexOf(song);
                if (index >= 0) {
                    this.songs.splice(index, 1);
                }
            };
            UploadAlbumController.songNameFromFileName = function (fileName) {
                var songName = fileName;
                // Slice off the extension.
                var lastIndexOfDot = songName.lastIndexOf(".");
                if (lastIndexOfDot > 0) {
                    songName = songName.substring(0, lastIndexOfDot);
                }
                // Slice off anything before " - "
                var lastIndexOfDash = songName.lastIndexOf(" - ");
                if (lastIndexOfDash >= 0) {
                    songName = songName.substr(lastIndexOfDash + 3);
                }
                return songName;
            };
            UploadAlbumController.filePickerSongToAlbumSong = function (file) {
                return {
                    fileName: file["friendlyName"],
                    address: file.url
                };
            };
            UploadAlbumController.getFriendlySwatches = function (rawSwatches) {
                return Object.getOwnPropertyNames(rawSwatches)
                    .filter(function (p) { return !!rawSwatches[p]; })
                    .map(function (p) {
                    var swatch = rawSwatches[p];
                    var friendlySwatch = {
                        name: p,
                        color: swatch.getHex(),
                        titleTextColor: swatch.getTitleTextColor(),
                        bodyTextColor: swatch.getBodyTextColor()
                    };
                    return friendlySwatch;
                });
            };
            UploadAlbumController.prototype.hexToRgbString = function (hex) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (result && result.length >= 4) {
                    return "rgb(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ")";
                }
                return "";
            };
            UploadAlbumController.prototype.artistSelected = function (artist) {
                this.artist = angular.copy(artist);
            };
            UploadAlbumController.prototype.upload = function () {
                var _this = this;
                if (!this.albumArt || !this.albumArt.url) {
                    throw new Error("Must have album art.");
                }
                if (!this.albumName) {
                    throw new Error("Must have album name.");
                }
                if (!this.artist) {
                    throw new Error("Must have an artist");
                }
                if (!this.isUploading) {
                    var album = {
                        albumArtUri: this.albumArt.url,
                        artist: this.artist.name,
                        backColor: this.backColor,
                        foreColor: this.foreColor,
                        genres: this.genre,
                        mutedColor: this.mutedColor,
                        name: this.albumName,
                        purchaseUrl: this.purchaseUrl,
                        songs: this.songs ? this.songs.map(UploadAlbumController.filePickerSongToAlbumSong) : [],
                        textShadowColor: this.textShadowColor
                    };
                    this.isUploading = true;
                    this.albumApi.upload(album)
                        .then(function (albumId) { return _this.appNav.editAlbum(album.artist, album.name); })
                        .finally(function () { return _this.isUploading = false; });
                }
            };
            return UploadAlbumController;
        }());
        UploadAlbumController.filePickerKey = "AwdRIarCGT8COm0mkYX1Ez";
        UploadAlbumController.$inject = [
            "artistApi",
            "albumApi",
            "appNav",
            "$scope",
            "$sce"
        ];
        Chavah.UploadAlbumController = UploadAlbumController;
        Chavah.App.controller("UploadAlbumController", UploadAlbumController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * A list that fetches its items asynchronously. Provides optional caching via local storage.
         */
        var List = (function () {
            /**
             * Constructs a new list.
             * @param fetcher The function that fetches the items from the server.
             * @param cacheKey Optional cache key that will store and fetch the items from local storage.
             * @param cacheSelector Optional selector function that rehydrates an item from local storage. If null or undefined, the raw JSON object read from storage will be used for the items.
             */
            function List(fetcher, cacheKey, cacheSelector, afterLoadProcessor) {
                this.fetcher = fetcher;
                this.cacheKey = cacheKey;
                this.cacheSelector = cacheSelector;
                this.afterLoadProcessor = afterLoadProcessor;
                this.items = [];
                this.hasLoaded = false;
                this.isLoading = false;
                this.noItemsText = "There are no results";
                if (cacheKey) {
                    this.rehydrateCachedItems(cacheKey, cacheSelector);
                }
            }
            List.prototype.reset = function () {
                this.items.length = 0;
                this.isLoading = false;
            };
            List.prototype.resetAndFetch = function () {
                this.reset();
                this.fetch();
            };
            List.prototype.fetch = function () {
                var _this = this;
                if (!this.isLoading) {
                    this.isLoading = true;
                    this.hasLoaded = false;
                    var task = this.fetcher();
                    task
                        .then(function (results) {
                        if (_this.isLoading) {
                            _this.items = results;
                            if (_this.afterLoadProcessor) {
                                _this.afterLoadProcessor(results);
                            }
                            if (_this.cacheKey) {
                                setTimeout(function () { return _this.cacheItems(_this.cacheKey, results); }, 0);
                            }
                        }
                        _this.hasLoaded = true;
                    })
                        .finally(function () { return _this.isLoading = false; });
                    return task;
                }
                return null;
            };
            List.prototype.remove = function (item) {
                var lengthBeforeRemoval = this.items.length;
                var arrayAfterRemoval = _.pull(this.items, item);
                return lengthBeforeRemoval > arrayAfterRemoval.length;
            };
            /**
             * Puts the items into the local cache. This is done automatically when the items are loaded, but calling this method can be useful for updating the cache after the items have been modified.
             */
            List.prototype.cache = function () {
                if (this.cacheKey) {
                    this.cacheItems(this.cacheKey, this.items);
                }
            };
            List.prototype.rehydrateCachedItems = function (cacheKey, cacheSelector) {
                try {
                    var cachedJson = window.localStorage.getItem(cacheKey);
                    if (cachedJson) {
                        var rawItems = JSON.parse(cachedJson);
                        if (cacheSelector) {
                            this.items = rawItems.map(function (i) { return cacheSelector(i); });
                        }
                        else {
                            this.items = rawItems;
                        }
                        if (this.afterLoadProcessor) {
                            this.afterLoadProcessor(this.items);
                        }
                    }
                }
                catch (error) {
                    console.log("Failed to rehydrated cached items for cacheKey", cacheKey, error);
                }
            };
            List.prototype.cacheItems = function (cacheKey, items) {
                try {
                    var itemsJson = JSON.stringify(items);
                    window.localStorage.setItem(cacheKey, itemsJson);
                }
                catch (error) {
                    console.log("Unable to cache list of items with cache key", cacheKey, items, error);
                }
            };
            Object.defineProperty(List.prototype, "isLoadedWithData", {
                get: function () {
                    return this.hasLoaded && !this.isLoading && this.itemsTotalCount > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(List.prototype, "isLoadedAndEmpty", {
                get: function () {
                    return this.itemsTotalCount === 0 && !this.isLoading;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(List.prototype, "itemsTotalCount", {
                get: function () {
                    return this.items.length;
                },
                enumerable: true,
                configurable: true
            });
            return List;
        }());
        Chavah.List = List;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * A list that fetches chunks of items at a time. Provides optional caching via local storage.
         */
        var PagedList = (function () {
            function PagedList(fetcher, cacheKey, afterFetch) {
                this.fetcher = fetcher;
                this.cacheKey = cacheKey;
                this.afterFetch = afterFetch;
                this.skip = 0;
                this.take = 10;
                this.items = [];
                this.isLoading = false;
                this.noItemsText = "There are no results";
                if (cacheKey) {
                    this.rehydrateCachedItems(cacheKey);
                }
            }
            PagedList.prototype.reset = function () {
                this.skip = 0;
                this.items.length = 0;
                this.itemsTotalCount = null;
                this.isLoading = false;
            };
            PagedList.prototype.resetAndFetch = function () {
                this.reset();
                this.fetchNextChunk();
            };
            PagedList.prototype.fetchNextChunk = function () {
                var _this = this;
                if (!this.isLoading) {
                    this.isLoading = true;
                    var skip = this.skip;
                    this.fetcher(skip, this.take)
                        .then(function (results) {
                        if (_this.isLoading) {
                            // If skip is zero, we're fetching the first chunk. 
                            // Empty array because we may have added items when rehydrating the cache.
                            var cacheKey = _this.cacheKey;
                            if (cacheKey && skip === 0) {
                                _this.items.length = 0;
                                _this.cacheItems(cacheKey, results.items);
                            }
                            (_a = _this.items).push.apply(_a, results.items);
                            _this.itemsTotalCount = results.total;
                            _this.skip += results.items.length;
                            if (_this.afterFetch) {
                                _this.afterFetch(_this.items);
                            }
                        }
                        var _a;
                    })
                        .finally(function () { return _this.isLoading = false; });
                }
            };
            PagedList.prototype.rehydrateCachedItems = function (cacheKey) {
                try {
                    var cachedJson = window.localStorage.getItem(cacheKey);
                    if (cachedJson) {
                        this.items = JSON.parse(cachedJson);
                        if (this.afterFetch) {
                            this.afterFetch(this.items);
                        }
                    }
                }
                catch (error) {
                    console.log("Failed to rehydrated cached items for cacheKey", cacheKey, error);
                }
            };
            PagedList.prototype.cacheItems = function (cacheKey, items) {
                try {
                    var itemsJson = JSON.stringify(items);
                    window.localStorage.setItem(cacheKey, itemsJson);
                }
                catch (error) {
                    console.log("Unable to cache list of items with cache key", cacheKey, items, error);
                }
            };
            Object.defineProperty(PagedList.prototype, "isLoadedWithData", {
                get: function () {
                    return this.itemsTotalCount != null && this.itemsTotalCount > 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PagedList.prototype, "isLoadedAndEmpty", {
                get: function () {
                    return this.itemsTotalCount === 0 && !this.isLoading;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PagedList.prototype, "hasMoreItems", {
                get: function () {
                    return this.itemsTotalCount != null && this.itemsTotalCount > this.items.length;
                },
                enumerable: true,
                configurable: true
            });
            return PagedList;
        }());
        Chavah.PagedList = PagedList;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
