var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var HttpApiService = /** @class */ (function () {
            function HttpApiService(loadingProgress, appNav, localStorageService, $http, $q) {
                this.loadingProgress = loadingProgress;
                this.appNav = appNav;
                this.localStorageService = localStorageService;
                this.$http = $http;
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
                    headers: this.createHeaders(),
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
                    headers: this.createHeaders(),
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
                    headers: this.createHeaders(),
                };
                // Encode the args into the URL
                // tslint:disable-next-line:forin
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
            HttpApiService.prototype.postFormData = function (relativeUrl, formData, selector) {
                var _this = this;
                var deferred = this.loadingProgress.start();
                var questionMarkOrAmpersand = relativeUrl.indexOf("?") !== -1 ? "&" : "?";
                var absoluteUrl = "" + this.apiBaseUrl + relativeUrl + questionMarkOrAmpersand;
                var request = {
                    method: "POST",
                    url: absoluteUrl,
                    data: formData,
                    headers: {
                        "Content-Type": undefined
                    }
                };
                var task = this.$http(request);
                task.then(function (result) {
                    var preppedResult = selector ? selector(result.data) : result.data;
                    deferred.resolve(preppedResult);
                });
                task.catch(function (error) {
                    _this.onAjaxError(error, "Error saving " + relativeUrl + ".");
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            HttpApiService.prototype.createHeaders = function () {
                // var jwtAuthHeader = this.createJwtAuthHeader();
                // if (jwtAuthHeader) {
                //    return { "Authorization": jwtAuthHeader };
                // }
                return {};
            };
            // private createJwtAuthHeader(): string {
            //    var jwt = this.localStorageService.get<string>(AccountService.jwtKey);
            //    if (jwt) {
            //        return `Bearer ${jwt}`;
            //    }
            //    return "";
            // }
            HttpApiService.prototype.onAjaxError = function (errorDetails, errorMessage) {
                // If we got 401 unauthorized, our sign-in cookie is probably stale or invalid. Go to sign in.
                if (errorDetails && errorDetails.status === 401) {
                    this.appNav.signIn();
                }
            };
            HttpApiService.$inject = [
                "loadingProgress",
                "appNav",
                "localStorageService",
                "$http",
                "$q",
            ];
            return HttpApiService;
        }());
        Chavah.HttpApiService = HttpApiService;
        Chavah.App.service("httpApi", HttpApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=HttpApiService.js.map