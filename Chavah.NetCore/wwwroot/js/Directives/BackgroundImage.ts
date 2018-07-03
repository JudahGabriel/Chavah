module BitShuva.Chavah {

    /**
     * Angular directive for setting the background image of an element.
     */
    class BackgroundImage {

        constructor(scope: ng.IScope, private element: JQuery, attributes: ng.IAttributes, ngModelCtrl: ng.INgModelController) {
            var backgroundImageUrl = scope.$eval(attributes["backgroundImage"]);
            scope.$watch(attributes["backgroundImage"], (newVal: string) => this.applyBackgroundImage(newVal));
        }

        private applyBackgroundImage(imageUrl: string) {
            if (imageUrl) {
                var backgroundImageCssValue = `url("${imageUrl}")`;
                this.element.css("background-image", backgroundImageCssValue);
            } else {
                this.element.css("background-image", "none");
            }
        }
    }

    export class BackgroundImageBinder implements ng.IDirective {
        link: ng.IDirectiveLinkFn;
        restrict = "A";
        priority = 99;

        constructor() {
            this.link = this.unboundLink.bind(this);
        }

        unboundLink(scope: ng.IScope, element: JQuery, attributes: ng.IAttributes, ngModelCtrl: ng.INgModelController) {
            new BackgroundImage(scope, element, attributes, ngModelCtrl);
        }
    }

    App.directive("backgroundImage", () => new BackgroundImageBinder());
}