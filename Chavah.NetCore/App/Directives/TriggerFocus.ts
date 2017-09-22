namespace BitShuva.Chavah {

    /**
     * Angular directive that triggers focus on an element given an expression that evaluates to true.
     */
    class TriggerFocus {

        constructor(private scope: ng.IScope, private element: JQuery, attributes: ng.IAttributes, timeout: ng.ITimeoutService, parse: ng.IParseService) {
            var model = parse(attributes["triggerFocus"]);
            scope.$watch(model, function (value) {
                if (value) {
                    timeout(() => element[0].focus());
                }
            });

            element.bind("blur", () => scope.$apply(model.assign(scope, false)));
        }
    }

    class TriggerFocusBinder implements ng.IDirective {
        link: ng.IDirectiveLinkFn;
        restrict = "A";

        constructor(private $timeout: ng.ITimeoutService, private $parse: ng.IParseService) {
            this.link = this.unboundLink.bind(this);
        }

        unboundLink(scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) {
            new TriggerFocus(scope, element, attributes, this.$timeout, this.$parse);
        }
    }

    App.directive("triggerFocus", ["$timeout", "$parse", ($timeout: ng.ITimeoutService, $parse: ng.IParseService) => new TriggerFocusBinder($timeout, $parse)]);
}