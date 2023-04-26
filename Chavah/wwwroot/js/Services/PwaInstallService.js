var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        /**
         * Listens for browser events allowing progressive web apps (PWAs) to be installed.
         * Chavah is a progressive web app that users can install to their device.
         * For more info, see https://developers.google.com/web/fundamentals/app-install-banners
         * */
        var PwaInstallService = /** @class */ (function () {
            function PwaInstallService() {
                var _this = this;
                this.deferredInstallPrompt = null;
                this.hasShownPrompt = false;
                // Browsers will trigger this event when it deems appropriate (e.g. the user has used our app often).
                window.addEventListener('beforeinstallprompt', function (e) {
                    // Prevent Chrome 67 and earlier from automatically showing the prompt
                    e.preventDefault();
                    // Stash the event so it can be triggered later.
                    _this.deferredInstallPrompt = e;
                });
            }
            Object.defineProperty(PwaInstallService.prototype, "canInstall", {
                get: function () {
                    return !!this.deferredInstallPrompt && !this.hasShownPrompt;
                },
                enumerable: false,
                configurable: true
            });
            PwaInstallService.prototype.install = function () {
                if (this.canInstall && !!this.deferredInstallPrompt) {
                    // Show the prompt
                    this.deferredInstallPrompt.prompt();
                    // Wait for the user to respond to the prompt.
                    return this.deferredInstallPrompt.userChoice;
                }
                // We can't install, so just return null.
                return null;
            };
            return PwaInstallService;
        }());
        Chavah.PwaInstallService = PwaInstallService;
        Chavah.App.service("pwaInstall", PwaInstallService);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=PwaInstallService.js.map