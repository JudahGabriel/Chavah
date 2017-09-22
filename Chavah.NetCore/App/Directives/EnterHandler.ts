namespace BitShuva.Chavah {
    
    /**
     * Angular directive that calls a function when the enter key is pressed on an input element.
     */
    class EnterHandler {

        constructor(private scope: ng.IScope, private element: JQuery, attributes: ng.IAttributes, parse: ng.IParseService) {
            var enterHandler = parse(attributes["enterHandler"]);
            element.on("keydown", (args: JQueryEventObject) => {
                var enterKey = 13;
                if (args.keyCode === enterKey) {
                    enterHandler(scope);
                    if (args.preventDefault) {
                        args.preventDefault();
                    }
                    scope.$applyAsync();
                }
            });

            element.on("$destroy", () => element.off("keydown $destroy"));
        }
    }

    class EnterHandlerBinder implements ng.IDirective {
        link: ng.IDirectiveLinkFn;
        restrict = "A";

        constructor(private $parse: ng.IParseService) {
            this.link = this.unboundLink.bind(this);
        }

        unboundLink(scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) {
            new EnterHandler(scope, element, attributes, this.$parse);
        }
    }

    App.directive("enterHandler", ["$parse", ($parse: ng.IParseService) => new EnterHandlerBinder($parse)]);
}