﻿namespace BitShuva.Chavah {
    export class ConfirmEmailController {

        static $inject = [
            "accountApi",
            "$routeParams",
        ];

        email = "";
        confirmCode = "";
        isConfirming = true;
        confirmSucceeded = false;
        confirmFailed = false;
        confirmFailedErrorMessage = "";

        constructor(
            private accountApi: AccountService,
            $routeParams: ng.route.IRouteParamsService) {
            this.email = $routeParams["email"];

            // The confirm code is generated by WebAPI. We manually replace any forward slashes with triple underscore,
            // otherwise the Angular route gets busted, even with encodeURIComponent.
            let escapedConfirmCode: string = $routeParams["confirmCode"] || "";
            // Put the forward slash(s) back in.
            this.confirmCode = escapedConfirmCode.replace(new RegExp("___", "g"), "/");

            setTimeout(() => this.confirm(), 1000);
        }

        confirm() {
            this.accountApi.confirmEmail(this.email, this.confirmCode)
                .then(results => this.confirmEmailCompleted(results))
                .catch(results => this.confirmEmailCompleted({
                    errorMessage: results && results.data && results.data.exceptionMessage ? results.data.exceptionMessage : "Couldn't confirm email",
                    success: false,
                }));
        }

        confirmEmailCompleted(results: Server.ConfirmEmailResult) {
            this.isConfirming = false;
            this.confirmSucceeded = results.success;
            this.confirmFailed = !this.confirmSucceeded;
            this.confirmFailedErrorMessage = results.errorMessage;
        }
    }

    App.controller("ConfirmEmailController", ConfirmEmailController);
}
