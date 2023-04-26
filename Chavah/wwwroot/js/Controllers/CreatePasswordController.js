var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var CreatePasswordController = /** @class */ (function () {
            function CreatePasswordController(accountApi, $routeParams) {
                this.accountApi = accountApi;
                this.password = "";
                this.showPasswordError = false;
                this.isSaving = false;
                this.hasCreatedPassword = false;
                this.email = $routeParams["email"];
                this.emailWithoutDomain = this.email.substr(0, this.email.indexOf("@"));
            }
            Object.defineProperty(CreatePasswordController.prototype, "isPasswordValid", {
                get: function () {
                    return !!this.password && this.password.length >= 6 && !!this.password.match(Chavah.ResetPasswordController.regexContainsLetterAndNumber);
                },
                enumerable: false,
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
            CreatePasswordController.minPasswordLength = 6;
            CreatePasswordController.$inject = [
                "accountApi",
                "$routeParams",
            ];
            return CreatePasswordController;
        }());
        Chavah.CreatePasswordController = CreatePasswordController;
        Chavah.App.controller("CreatePasswordController", CreatePasswordController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=CreatePasswordController.js.map