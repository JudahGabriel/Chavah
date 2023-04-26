var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var UserApiService = /** @class */ (function () {
            function UserApiService(httpApi) {
                this.httpApi = httpApi;
            }
            UserApiService.prototype.updateProfile = function (user) {
                return this.httpApi.post("/api/users/updateProfile", user);
            };
            UserApiService.prototype.updateProfilePic = function (file) {
                var url = "/api/users/uploadProfilePicture";
                var formData = new FormData();
                formData.append("photo", file);
                return this.httpApi.postFormData(url, formData);
            };
            UserApiService.prototype.saveVolume = function (volume) {
                var args = {
                    volume: volume
                };
                return this.httpApi.postUriEncoded("/api/users/saveVolume", args);
            };
            UserApiService.prototype.getProfilePicForEmailAddress = function (email) {
                var args = {
                    email: email,
                    v: "1.0"
                };
                return this.httpApi.query("/api/users/getProfilePicForEmailAddress", args);
            };
            UserApiService.prototype.getRegistrations = function (fromDate) {
                var args = {
                    fromDate: fromDate
                };
                return this.httpApi.query("/api/users/getRegistrations", args);
            };
            UserApiService.$inject = ["httpApi"];
            return UserApiService;
        }());
        Chavah.UserApiService = UserApiService;
        Chavah.App.service("userApi", UserApiService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=UserApiService.js.map