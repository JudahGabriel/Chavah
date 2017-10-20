namespace Chavah {
    /**
     * Angular directive that handles a changed event from a file input.
     */
    //class FileUploadChanged {
    //    constructor(private scope: ng.IScope, private element: JQuery, attributes: ng.IAttributes, parse: ng.IParseService) {
    //        var handler = parse(attributes["fileUploadChanged"]);
    //        element.on("change", (args) => handler(scope, { e: args }));
    //    }
    //}

    //class FileUploadChangedBinder implements ng.IDirective {
    //    link: ng.IDirectiveLinkFn;
    //    restrict = "A";

    //    constructor(private parse: ng.IParseService) {
    //        this.link = this.unboundLink.bind(this);
    //    }

    //    unboundLink(scope: ng.IScope, element: JQuery, attributes: ng.IAttributes) {
    //        new FileUploadChanged(scope, element, attributes, this.parse);
    //    }
    //}

    //App.directive("fileUploadChanged", ["$parse", ($parse: ng.IParseService) => new FileUploadChangedBinder($parse)]);
}