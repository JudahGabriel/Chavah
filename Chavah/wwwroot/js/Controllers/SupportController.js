var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SupportController = /** @class */ (function () {
            function SupportController(accountApi) {
                var _this = this;
                this.accountApi = accountApi;
                this.name = "";
                this.email = "";
                this.message = "";
                this.isSaving = false;
                this.state = "unsubmitted";
                this.accountApi.signedInState
                    .select(function () { return _this.accountApi.currentUser; })
                    .subscribe(function (user) { return _this.signedInUserChanged(user); });
                if (accountApi.currentUser) {
                    this.email = accountApi.currentUser.email;
                }
            }
            Object.defineProperty(SupportController.prototype, "canSubmit", {
                get: function () {
                    return !this.isSaving &&
                        !!this.message && this.message.length > 0 &&
                        !!this.email && this.email.length > 0 &&
                        !!this.name && this.name.length > 0;
                },
                enumerable: false,
                configurable: true
            });
            SupportController.prototype.submit = function () {
                var _this = this;
                if (this.canSubmit) {
                    this.isSaving = true;
                    this.accountApi.sendSupportMessage(this.name, this.email, this.message, window.navigator.userAgent)
                        .then(function () { return _this.state = "success"; }, function () { return _this.state = "error"; })
                        .finally(function () { return _this.isSaving = false; });
                }
            };
            SupportController.prototype.signedInUserChanged = function (user) {
                if (user) {
                    this.email = user.email;
                }
            };
            SupportController.$inject = [
                "accountApi"
            ];
            return SupportController;
        }());
        Chavah.SupportController = SupportController;
        Chavah.App.controller("SupportController", SupportController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SupportController.js.map