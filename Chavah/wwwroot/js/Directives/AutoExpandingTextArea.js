var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Angular directive that changes a <textarea> element to automatically grow its height as more text is typed into it.
         * Based on https://codepen.io/vsync/pen/frudD
         */
        var AutoExpandingTextAreaHandler = /** @class */ (function () {
            function AutoExpandingTextAreaHandler(scope, element, attributes, parse) {
                var _this = this;
                this.scope = scope;
                this.element = element;
                this.baseScrollHeight = 0;
                this.textAreaElement = element[0];
                this.minRows = attributes["autoExpandingTextAreaMinRows"] ? parseInt(attributes["autoExpandingTextAreaMinRows"], 10) : 1;
                this.applyCss(element);
                // The first time we focus, save the original height.
                element.one("focus", function () { return _this.storeBaseScrollHeight(); });
                // As we type, auto expand.
                element.on("input", function () { return _this.sizeHeightToContents(); });
                // Cleanup.
                element.on("$destroy", function () { return element.off("input", "focus"); });
            }
            AutoExpandingTextAreaHandler.prototype.sizeHeightToContents = function () {
                this.textAreaElement.rows = this.minRows;
                var newRowCount = Math.ceil((this.textAreaElement.scrollHeight - this.baseScrollHeight) / 16);
                console.log("input changed. scrollHeight, baseScrollHeight, calc:", this.textAreaElement.scrollHeight, this.baseScrollHeight, newRowCount);
                var rows = newRowCount;
                this.textAreaElement.rows = this.minRows + rows;
            };
            AutoExpandingTextAreaHandler.prototype.storeBaseScrollHeight = function () {
                var savedValue = this.textAreaElement.value;
                this.textAreaElement.value = '';
                this.baseScrollHeight = this.textAreaElement.scrollHeight;
                console.log("base scroll height is...", this.baseScrollHeight);
                this.textAreaElement.value = savedValue;
            };
            AutoExpandingTextAreaHandler.prototype.applyCss = function (element) {
                element.css({
                    "display": "block",
                    "box-sizing": "padding-box",
                    "overflow": "hidden",
                    //
                    "border": "0",
                    //
                    "font-family": "sans-serif",
                    "line-height": "16.1px"
                });
            };
            return AutoExpandingTextAreaHandler;
        }());
        // tslint:disable-next-line:max-classes-per-file
        var AutoExpandingTextAreaBinder = /** @class */ (function () {
            function AutoExpandingTextAreaBinder($parse) {
                this.$parse = $parse;
                this.restrict = "A";
                this.link = this.unboundLink.bind(this);
            }
            AutoExpandingTextAreaBinder.prototype.unboundLink = function (scope, element, attributes) {
                // tslint:disable-next-line:no-unused-expression
                new AutoExpandingTextAreaHandler(scope, element, attributes, this.$parse);
            };
            return AutoExpandingTextAreaBinder;
        }());
        Chavah.App.directive("autoExpandingTextArea", ["$parse", function ($parse) { return new AutoExpandingTextAreaBinder($parse); }]);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AutoExpandingTextArea.js.map