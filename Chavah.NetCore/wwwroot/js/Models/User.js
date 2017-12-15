var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var User = /** @class */ (function () {
            function User(email, roles) {
                this.email = email;
                this.roles = roles;
                this.isAdmin = roles && roles.includes(User.roles.admin);
            }
            User.roles = {
                admin: "admin"
            };
            return User;
        }());
        Chavah.User = User;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=User.js.map