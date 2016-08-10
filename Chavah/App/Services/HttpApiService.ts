namespace BitShuva.Chavah {
    export class HttpApiService {

        static $inject = [
            "$http",
            "$q"
        ];

        constructor(private $http: ng.IHttpService, private $q: ng.IQService) {
        }

        public query<T>(url: string, args?: any, resultsSelector?: (raw: any) => T): ng.IPromise<T> {
            //var task = this.$http.get(url, {
            //    params: args ? $.param(args) : null
            //});

            var config: ng.IRequestConfig = {
                url: url,
                method: "GET",
                params: args
            };
            var task = this.$http(config);

            var result = this.$q.defer<T>();
            if (resultsSelector) {
                task.success(raw => result.resolve(resultsSelector(raw)));
            } else {
                task.success((raw: T) => result.resolve(raw));
            }

            task.error(error => result.reject(error));
            return result.promise;
        }

        public post<T>(url: string, args?: any, resultsSelector?: (raw: any) => T): ng.IPromise<T> {
            var task = this.$http.post(url, args);

            if (resultsSelector) {
                return task.then(raw => resultsSelector(raw));
            }

            return task;
        }
    }

    App.service("httpApi", HttpApiService);
} 