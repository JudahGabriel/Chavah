namespace BitShuva.Chavah {

    /**
     * Angular directive that changes a <textarea> element to automatically grow its height as more text is typed into it.
     * Based on https://codepen.io/vsync/pen/frudD
     */
    class AutoExpandingTextAreaHandler {

        baseScrollHeight = 0;
        readonly textAreaElement: HTMLTextAreaElement;
        readonly minRows: number;

        constructor(private scope: ng.IScope,
            private element: JQuery,
            attributes: ng.IAttributes,
            parse: ng.IParseService) {

            this.textAreaElement = element[0] as HTMLTextAreaElement;
            this.minRows = attributes["autoExpandingTextAreaMinRows"] ? parseInt(attributes["autoExpandingTextAreaMinRows"], 10) : 1;
            
            this.applyCss(element);

            // The first time we focus, save the original height.
            element.one("focus", () => this.storeBaseScrollHeight());

            // As we type, auto expand.
            element.on("input", () => this.sizeHeightToContents());

            // Cleanup.
            element.on("$destroy", () => element.off("input", "focus"));
        }

        private sizeHeightToContents() {
            this.textAreaElement.rows = this.minRows;
            const newRowCount = Math.ceil((this.textAreaElement.scrollHeight - this.baseScrollHeight) / 16); 
            const rows = newRowCount;
            this.textAreaElement.rows = this.minRows + rows;
        }

        private storeBaseScrollHeight() {
            const savedValue = this.textAreaElement.value;
            this.textAreaElement.value = '';
            this.baseScrollHeight = this.textAreaElement.scrollHeight;
            this.textAreaElement.value = savedValue;
        }

        private applyCss(element: JQuery) {
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
        }
    }

    // tslint:disable-next-line:max-classes-per-file
    class AutoExpandingTextAreaBinder implements ng.IDirective {
        link: ng.IDirectiveLinkFn;
        restrict = "A";

        constructor(private $parse: ng.IParseService) {
            this.link = this.unboundLink.bind(this);
        }

        unboundLink(scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) {
            // tslint:disable-next-line:no-unused-expression
            new AutoExpandingTextAreaHandler(scope, element, attributes, this.$parse);
        }
    }

    App.directive("autoExpandingTextArea", ["$parse", ($parse: ng.IParseService) => new AutoExpandingTextAreaBinder($parse)]);
}
