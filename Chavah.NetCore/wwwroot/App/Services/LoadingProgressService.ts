namespace BitShuva.Chavah {

    /**
     * Service that allows you to create deferred objects that show loading UI.
     * When the loading is completed, if no other load operations are occurring,  the loading UI will be hidden.
     */
    export class LoadingProgressService {
        resultsInProgress = 0;

        static $inject = ["$q"];

        constructor(private $q: ng.IQService) {
        };

        /**
         * Creates a deferred object and shows the loading UI until the deferred work completes.
         */
        start<T>(): ng.IDeferred<T> {
            var deferred = this.$q.defer<T>();

            this.loadingStarted();
            deferred.promise.finally(() => this.loadingEnded());

            return deferred;
        }

        get isLoading(): boolean {
            return this.resultsInProgress > 0;
        }

        private loadingStarted() {
            this.resultsInProgress++;

            if (this.resultsInProgress === 1) {
                NProgress.start();
            }
        }

        private loadingEnded() {
            this.resultsInProgress--;

            if (this.resultsInProgress === 0) {
                NProgress.done();
            }
        }
    }

    App.service("loadingProgress", LoadingProgressService);
}