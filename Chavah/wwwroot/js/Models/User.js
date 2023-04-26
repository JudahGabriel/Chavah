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
                    if (this.roles === undefined) {
                        return false;
                    }
                    return this.roles.map(function (v) { return v.toLowerCase(); }).includes(User.roles.admin.toLowerCase());
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(User.prototype, "displayName", {
                get: function () {
                    if (this.firstName && this.lastName) {
                        return this.firstName + " " + this.lastName;
                    }
                    return this.email.substring(0, this.email.indexOf('@'));
                },
                enumerable: false,
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