var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Use Croppie for a simple image cropping.
         * @see  https://github.com/Foliotek/Croppie
         * @see  https://lingohub.com/blog/2016/03/angularjs-directives-image-cropping/
         * @example
         *   <image-cropper src="imageUrlOrBase64" ng-model="vm.croppedImage"></image-cropper>
         */
        Chavah.App.directive("imageCropper", function () {
            return {
                restrict: 'E',
                scope: {
                    src: '=',
                    ngModel: '=',
                    base64: '='
                },
                link: function (scope, element, attrs) {
                    function CroppieLoaded() {
                        // If we don't have a source image, or haven't loaded the Croppie library, there's nothing to do.
                        if (!scope["src"] || !window["Croppie"]) {
                            return;
                        }
                        var myCrop = new Croppie(element[0], {
                            viewport: {
                                width: 200,
                                height: 200,
                                type: "circle"
                            },
                            boundary: { width: 300, height: 300 }
                        });
                        myCrop.bind({
                            url: scope["src"]
                        });
                        // When we zoom or pan, update the model.
                        element.on("update.croppie", function () {
                            myCrop.result("blob").then(function (imgBlob) { return scope.$applyAsync(function () { return scope["ngModel"] = imgBlob; }); });
                            myCrop.result("base64").then(function (imgBase64) { return scope.$applyAsync(function () { return scope["base64"] = imgBase64; }); });
                        });
                    }
                    // If the source raw image changes, update Croppie with the new image.
                    scope.$watch("src", function (newVal, oldVal) {
                        if (newVal) {
                            CroppieLoaded();
                        }
                    });
                    // Is Croppie jQuery plugin loaded already?
                    if (window["Croppie"]) {
                        CroppieLoaded();
                    }
                    else {
                        // Has another instance of ImageCropper added the script?
                        var croppieScriptId = "croppieScriptInitForImageCropper";
                        var isCroppieScriptAddedToDoc = $("#" + croppieScriptId).length > 0;
                        if (isCroppieScriptAddedToDoc) {
                            // Another instance of ImageCropper added the Croppie script. Wait for that to load.
                            $(document).on("croppieLoaded", CroppieLoaded);
                        }
                        else {
                            // Nope, we're the first. Let's add the Croppie script and CSS element.
                            var croppieScriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.2/croppie.min.js";
                            var croppieCssUrl = "https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.2/croppie.min.css";
                            // Append the script element.
                            var croppieScript = document.createElement("script");
                            croppieScript.async = true;
                            croppieScript.id = croppieScriptId;
                            $("body").append(croppieScript);
                            croppieScript.onload = function () {
                                $(document).trigger("croppieLoaded");
                                CroppieLoaded();
                            };
                            croppieScript.src = croppieScriptUrl;
                            // Append the CSS element.
                            var croppieStyle = document.createElement("link");
                            croppieStyle.setAttribute("href", croppieCssUrl);
                            croppieStyle.setAttribute("rel", "stylesheet");
                            croppieStyle.setAttribute("type", "text/css");
                            document.body.appendChild(croppieStyle);
                        }
                    }
                }
            };
        });
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=ImageCropper.js.map