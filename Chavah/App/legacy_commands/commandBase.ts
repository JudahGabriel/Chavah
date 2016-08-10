class CommandBase {
    
    constructor() {
    }

    execute<T>(): JQueryPromise<T> {
        throw new Error("Execute must be overridden.");
    }

    urlEncodeArgs(args: any): string {
        var propNameAndValues = [];
        for (var prop in args) {
            var value = args[prop];
            propNameAndValues.push(prop + "=" + encodeURIComponent(value));
        }

        return "?" + propNameAndValues.join("&");
    }

    query<T>(relativeUrl: string, args?: any, resultsSelector?: (results: any) => T): JQueryPromise<T> {
        return this.ajax(relativeUrl, args, "GET", resultsSelector, null);
    }

    put(relativeUrl: string, args: any, options?: JQueryAjaxSettings): JQueryPromise<any> {
        return this.ajax(relativeUrl, args, "PUT", null, options);
    }

    /*
     * Performs a DELETE rest call.
    */
    del(relativeUrl: string, args?: any, options?: JQueryAjaxSettings): JQueryPromise<any> {
        return this.ajax(relativeUrl, args, "DELETE", null, options);
    }

    post<T>(relativeUrl: string, args?: any, resultsSelector?: (results: any) => T, options?: JQueryAjaxSettings): JQueryPromise<any> {
        return this.ajax(relativeUrl, args, "POST", resultsSelector, options);
    }

    private ajax<T>(relativeUrl: string, args: any, method: string, resultsSelector?: (results: any) => T, options?: JQueryAjaxSettings): JQueryPromise<any> {
        //var contentType = method === "application/json; charset=utf-8";
        var defaultOptions: JQueryAjaxSettings = {
            cache: false,
            url: relativeUrl,
            data: args,
            type: method,
            headers: undefined
        };

        if (options) {
            for (var prop in options) {
                defaultOptions[prop] = options[prop];
            }
        }

        var ajax = $.ajax(defaultOptions);
        var trackJs = window['trackJs'];
        if (resultsSelector) {
            var task = $.Deferred();
            ajax.done((results, status, xhr) => {
                var transformedResults = resultsSelector(results);
                task.resolve(transformedResults);
            });            
            ajax
                .fail((request: JQueryXHR, status: string, error: string) => task.reject(request, status, error))
                .fail((request: JQueryXHR, status: string, error: string) => {
                    if (request.status === 0 && request.readyState === 0 && request.statusText === "error") {
                        // We've seen this strange error on ocassion via TrackJS, possibly due to repeated requests.
                        // We can safely ignore this error.
                    } else {
                        trackJs.error("Executing " + relativeUrl + " resulted in error [1]. " + (request.responseText || JSON.stringify(request)));
                    }
                });
            return task;
        } else {
            return ajax.fail((error: JQueryXHR) => trackJs.error("Executing " + relativeUrl + " resulted in error [2]. " + (error.responseText || JSON.stringify(error))));
        }
    }
}

export = CommandBase;