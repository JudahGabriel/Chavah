var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var User = /** @class */ (function () {
            function User(serverObj) {
                angular.merge(this, serverObj);
            }
            Object.defineProperty(User.prototype, "isAdmin", {
                get: function () {
                    return this.roles.includes(User.roles.admin);
                },
                enumerable: true,
                configurable: true
            });
            User.prototype.updateFrom = function (other) {
                angular.merge(this, other);
            };
            User.roles = {
                admin: "admin"
            };
            return User;
        }());
        Chavah.User = User;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=User.js.map