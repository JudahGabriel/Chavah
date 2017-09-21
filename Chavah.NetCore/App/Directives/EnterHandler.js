var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that calls a function when the enter key is pressed on an input element.
         */
        var EnterHandler = (function () {
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
        var EnterHandlerBinder = (function () {
            function EnterHandlerBinder($parse) {
                this.$parse = $parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            EnterHandlerBinder.prototype.unboundLink = function (scope, element, attributes) {
                new EnterHandler(scope, element, attributes, this.$parse);
            };
            return EnterHandlerBinder;
        }());
        Chavah.App.directive("enterHandler", ["$parse", function ($parse) { return new EnterHandlerBinder($parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));