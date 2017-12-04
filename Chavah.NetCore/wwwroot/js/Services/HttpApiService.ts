namespace BitShuva.Chavah {
    export class HttpApiService {

        static $inject = [
            "loadingProgress",
            "$http",
            "localStorageService",
            "$q",
        ];

        apiBaseUrl = "";

        constructor(
            private loadingProgress: LoadingProgressService,
            private $http: ng.IHttpService,
            private localStorageService: ng.local.storage.ILocalStorageService,
            private $q: ng.IQService) {
        }

        query<T>(relativeUrl: string, args: any = null,
                 selector?: (rawResult: any) => T, showProgress = true): ng.IPromise<T> {
            let progress: ng.IDeferred<T>;
            if (showProgress) {
                progress = this.loadingProgress.start<T>();
            } else {
                progress = this.$q.defer<T>();
            }

            let config: ng.IRequestConfig = {
                url: this.apiBaseUrl + relativeUrl,
                method: "GET",
                params: args,
                headers: this.createHeaders(),
            };

            this.$http(config)
                .then(result => {
                    let preppedResult: T = selector ? selector(result.data) : result.data as T;
                    progress.resolve(preppedResult);
                }, failed => {
                    progress.reject(failed);
                    this.onAjaxError(failed, `Error loading ${relativeUrl}.`);
                });

            return progress.promise;
        }

        post<T>(relativeUrl: string, args: any, selector?: (rawResult: any) => T, showProgress = true): ng.IPromise<T> {
            let deferred: ng.IDeferred<T>;
            if (showProgress) {
                deferred = this.loadingProgress.start<T>();
            } else {
                deferred = this.$q.defer<T>();
            }

            let absoluteUrl = `${this.apiBaseUrl}${relativeUrl}`;
            let config: ng.IRequestShortcutConfig = {
                headers: this.createHeaders(),
            };

            let postTask = this.$http.post(absoluteUrl, args, config);
            postTask.then((result: any) => {
                let preppedResult = selector ? selector(result.data) : result.data;
                deferred.resolve(preppedResult);
            });
            postTask.catch(error => {
                this.onAjaxError(error, `Error saving ${relativeUrl}.`);
                deferred.reject(error);
            });

            return deferred.promise;
        }

        postUriEncoded<T>(relativeUrl: string, args: any,
                          selector?: (rawResult: any) => T, showProgress = true): ng.IPromise<T> {
            let deferred: ng.IDeferred<T>;
            if (showProgress) {
                deferred = this.loadingProgress.start<T>();
            } else {
                deferred = this.$q.defer<T>();
            }

            let absoluteUrl = `${this.apiBaseUrl}${relativeUrl}?`;
            let config: ng.IRequestShortcutConfig = {
                headers: this.createHeaders(),
            };

            // Encode the args into the URL
            // tslint:disable-next-line:forin
            for (let prop in args) {
                let isFirstArgument = absoluteUrl.endsWith("?");
                absoluteUrl += isFirstArgument ? "" : "&";
                let arg = args[prop] as string | null;
                let argAsString = arg ? arg.toString() : "";
                let argEscaped = encodeURIComponent(argAsString);
                absoluteUrl += `${prop}=${argEscaped}`;
            }

            let postTask = this.$http.post(absoluteUrl, null, config);
            postTask.then((result: any) => {
                let preppedResult = selector ? selector(result.data) : result.data;
                deferred.resolve(preppedResult);
            });
            postTask.catch(error => {
                this.onAjaxError(error, `Error saving ${relativeUrl}.`);
                deferred.reject(error);
            });

            return deferred.promise;
        }

        private createHeaders(): {} {
            // var jwtAuthHeader = this.createJwtAuthHeader();
            // if (jwtAuthHeader) {
            //    return { "Authorization": jwtAuthHeader };
            // }

            return {};
        }

        // private createJwtAuthHeader(): string {
        //    var jwt = this.localStorageService.get<string>(AccountService.jwtKey);
        //    if (jwt) {
        //        return `Bearer ${jwt}`;
        //    }

        //    return "";
        // }

        private onAjaxError(errorDetails: any, errorMessage: string) {
            // If we got 401 unauthorized, the token is probably stale or invalid. Go to sign in.
            // if (errorDetails && errorDetails.status === 401) {
            //    this.appNav.signIn();
            // } else {
            //    this.errors.push({
            //        error: errorDetails,
            //        message: errorMessage
            //    });

            //    this.isShowingApiError = true;
            // }
        }
    }

    App.service("httpApi", HttpApiService);
}
