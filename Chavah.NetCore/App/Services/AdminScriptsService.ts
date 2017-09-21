namespace BitShuva.Chavah {

    /**
     * Service that adds admin-specific scripts to the document if not already added.
     */
    export class AdminScriptsService {
        private hasInstalled = false;

        install() {
            if (!this.hasInstalled) {
                this.hasInstalled = true;

                var adminScripts = [
                    "https://api.filepicker.io/v1/filepicker.js",
                    "https://cdnjs.cloudflare.com/ajax/libs/vibrant.js/1.0.0/Vibrant.min.js"
                ];
                adminScripts.forEach(s => {
                    var script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = s;
                    document.body.appendChild(script);
                });
            }
        }
    }

    App.service("adminScripts", AdminScriptsService);
}