var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive for setting the background image of an element.
         */
        var BackgroundImage = /** @class */ (function () {
            function BackgroundImage(scope, element, attributes, ngModelCtrl) {
                var _this = this;
                this.element = element;
                var backgroundImageUrl = scope.$eval(attributes["backgroundImage"]);
                scope.$watch(attributes["backgroundImage"], function (newVal) { return _this.applyBackgroundImage(newVal); });
            }
            BackgroundImage.prototype.applyBackgroundImage = function (imageUrl) {
                if (imageUrl) {
                    var backgroundImageCssValue = "url(\"" + imageUrl + "\")";
                    this.element.css("background-image", backgroundImageCssValue);
                }
                else {
                    this.element.css("background-image", "none");
                }
            };
            return BackgroundImage;
        }());
        var BackgroundImageBinder = /** @class */ (function () {
            function BackgroundImageBinder() {
                this.restrict = "A";
                this.priority = 99;
                this.link = this.unboundLink.bind(this);
            }
            BackgroundImageBinder.prototype.unboundLink = function (scope, element, attributes, ngModelCtrl) {
                new BackgroundImage(scope, element, attributes, ngModelCtrl);
            };
            return BackgroundImageBinder;
        }());
        Chavah.BackgroundImageBinder = BackgroundImageBinder;
        Chavah.App.directive("backgroundImage", function () { return new BackgroundImageBinder(); });
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=BackgroundImage.js.map