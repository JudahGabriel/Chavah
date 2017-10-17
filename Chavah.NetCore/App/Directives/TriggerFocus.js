var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that triggers focus on an element given an expression that evaluates to true.
         */
        var TriggerFocus = (function () {
            function TriggerFocus(scope, element, attributes, timeout, parse) {
                this.scope = scope;
                this.element = element;
                var model = parse(attributes["triggerFocus"]);
                scope.$watch(model, function (value) {
                    if (value) {
                        timeout(function () { return element[0].focus(); });
                    }
                });
                element.bind("blur", function () { return scope.$apply(model.assign(scope, false)); });
            }
            return TriggerFocus;
        }());
        var TriggerFocusBinder = (function () {
            function TriggerFocusBinder($timeout, $parse) {
                this.$timeout = $timeout;
                this.$parse = $parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            TriggerFocusBinder.prototype.unboundLink = function (scope, element, attributes) {
                new TriggerFocus(scope, element, attributes, this.$timeout, this.$parse);
            };
            return TriggerFocusBinder;
        }());
        Chavah.App.directive("triggerFocus", ["$timeout", "$parse", function ($timeout, $parse) { return new TriggerFocusBinder($timeout, $parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
