var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Service that adds admin-specific scripts to the document if not already added.
         */
        var AdminScriptsService = /** @class */ (function () {
            function AdminScriptsService() {
                this.hasInstalled = false;
            }
            AdminScriptsService.prototype.install = function () {
                if (!this.hasInstalled) {
                    this.hasInstalled = true;
                    var adminScripts = [
                        "https://api.filepicker.io/v1/filepicker.js",
                        "https://cdnjs.cloudflare.com/ajax/libs/vibrant.js/1.0.0/Vibrant.min.js"
                    ];
                    adminScripts.forEach(function (s) {
                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src = s;
                        document.body.appendChild(script);
                    });
                }
            };
            return AdminScriptsService;
        }());
        Chavah.AdminScriptsService = AdminScriptsService;
        Chavah.App.service("adminScripts", AdminScriptsService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AdminScriptsService.js.map