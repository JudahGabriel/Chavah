namespace BitShuva.Chavah {

    /**
     * Service that adds admin-specific scripts to the document if not already added.
     */
    export class AdminScriptsService {
        private hasInstalled = false;

        install() {
            if (!this.hasInstalled) {
                this.hasInstalled = true;

                const adminScripts = [
                    "https://api.filepicker.io/v1/filepicker.js",
                    "https://cdnjs.cloudflare.com/ajax/libs/vibrant.js/1.0.0/Vibrant.min.js"
                ];
                adminScripts.forEach(s => {
                    let script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = s;
                    document.body.appendChild(script);
                });
            }
        }

        installScript(url: string, scriptAlreadyLoadedCheck: () => boolean): Promise<void> {
            return new Promise((resolve, reject) => {
                if (scriptAlreadyLoadedCheck()) {
                    resolve();
                }

                const script = document.createElement("script");
                script.type = "text/javascript";
                script.async = true;
                script.src = url;
                script.onload = () => resolve();
                script.onerror = (error) => reject(error);
                document.body.appendChild(script);
            });
        }
    }

    App.service("adminScripts", AdminScriptsService);
}
