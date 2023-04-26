var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var StructuredLog = /** @class */ (function () {
            function StructuredLog(serverObj) {
                this.activeOccurrenceIndex = 0;
                this.activeCategory = "Message";
                this.isExpanded = false;
                angular.merge(this, serverObj);
            }
            return StructuredLog;
        }());
        Chavah.StructuredLog = StructuredLog;
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=StructuredLog.js.map