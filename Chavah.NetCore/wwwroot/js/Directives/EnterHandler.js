var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that calls a function when the enter key is pressed on an input element.
         */
        var EnterHandler = /** @class */ (function () {
            function EnterHandler(scope, element, attributes, parse) {
                this.scope = scope;
                this.element = element;
                var enterHandler = parse(attributes["enterHandler"]);
                element.on("keydown", function (args) {
                    var enterKey = 13;
                    if (args.keyCode === enterKey) {
                        enterHandler(scope);
                        if (args.preventDefault) {
                            args.preventDefault();
                        }
                        scope.$applyAsync();
                    }
                });
                element.on("$destroy", function () { return element.off("keydown $destroy"); });
            }
            return EnterHandler;
        }());
        // tslint:disable-next-line:max-classes-per-file
        var EnterHandlerBinder = /** @class */ (function () {
            function EnterHandlerBinder($parse) {
                this.$parse = $parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            EnterHandlerBinder.prototype.unboundLink = function (scope, element, attributes) {
                // tslint:disable-next-line:no-unused-expression
                new EnterHandler(scope, element, attributes, this.$parse);
            };
            return EnterHandlerBinder;
        }());
        Chavah.App.directive("enterHandler", ["$parse", function ($parse) { return new EnterHandlerBinder($parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=EnterHandler.js.map