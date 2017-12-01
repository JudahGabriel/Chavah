var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var Artist = (function () {
            function Artist(serverObj) {
                this.isSaving = false;
                if (!serverObj) {
                    serverObj = Artist.createDefaultServerObj();
                }
                angular.merge(this, serverObj);
            }
            Artist.prototype.updateFrom = function (serverObj) {
                angular.merge(this, serverObj);
            };
            // tslint:disable-next-line:member-ordering
            Artist.createDefaultServerObj = function () {
                return {
                    bio: "",
                    images: [],
                    name: "",
                };
            };
            return Artist;
        }());
        Chavah.Artist = Artist;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=Artist.js.map