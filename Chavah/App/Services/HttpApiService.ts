namespace BitShuva.Chavah {
    export class HttpApiService {

        apiBaseUrl = ""

        static $inject = [
            "loadingProgress",
            "$http",
            "$q"
        ];

        constructor(
            private loadingProgress: LoadingProgressService,
            private $http: ng.IHttpService,
            private $q: ng.IQService) {
        }

        query<T>(relativeUrl: string, args: any = null, selector?: (rawResult: any) => T, showProgress = true): ng.IPromise<T> {
            var progress: ng.IDeferred<T>;
            if (showProgress) {
                progress = this.loadingProgress.start<T>();
            } else {
                progress = this.$q.defer<T>();
            }
            
            var config: ng.IRequestConfig = {
                url: this.apiBaseUrl + relativeUrl,
                method: "GET",
                params: args
            };

            this.$http(config)
                .then(result => {
                    var preppedResult: T = selector ? selector(result.data) : <T>result.data;
                    progress.resolve(preppedResult);
                }, failed => {
                    progress.reject(failed);
                    this.onAjaxError(failed, `Error loading ${relativeUrl}.`);
                });

            return progress.promise;
        }

        post<T>(relativeUrl: string, args: any, selector?: (rawResult: any) => T, showProgress = true): ng.IPromise<T> {
            var deferred: ng.IDeferred<T>;
            if (showProgress) {
                deferred = this.loadingProgress.start<T>();
            } else {
                deferred = this.$q.defer<T>();
            }
            
            var absoluteUrl = `${this.apiBaseUrl}${relativeUrl}`;
            var postTask = this.$http.post(absoluteUrl, args);
            postTask.then((result: any) => {
                var preppedResult = selector ? selector(result.data) : result.data;
                deferred.resolve(preppedResult);
            });
            postTask.catch(error => {
                this.onAjaxError(error, `Error saving ${relativeUrl}.`);
                deferred.reject(error);
            });

            return deferred.promise;
        }

        private onAjaxError(errorDetails: any, errorMessage: string) {
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
        }
    }

    App.service("httpApi", HttpApiService);
} 