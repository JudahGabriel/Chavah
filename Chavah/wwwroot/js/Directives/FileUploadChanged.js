var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that handles a changed event from a file input.
         */
        var FileUploadChanged = /** @class */ (function () {
            function FileUploadChanged(scope, element, attributes, parse) {
                this.scope = scope;
                this.element = element;
                var handler = parse(attributes["fileUploadChanged"]);
                element.on("change", function (args) {
                    handler(scope, { e: args });
                    scope.$applyAsync();
                });
            }
            return FileUploadChanged;
        }());
        var FileUploadChangedBinder = /** @class */ (function () {
            function FileUploadChangedBinder(parse) {
                this.parse = parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            FileUploadChangedBinder.prototype.unboundLink = function (scope, element, attributes) {
                new FileUploadChanged(scope, element, attributes, this.parse);
            };
            return FileUploadChangedBinder;
        }());
        Chavah.App.directive("fileUploadChanged", ["$parse", function ($parse) { return new FileUploadChangedBinder($parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=FileUploadChanged.js.map