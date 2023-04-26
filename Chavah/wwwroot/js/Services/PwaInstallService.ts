namespace BitShuva.Chavah {
    /**
     * Listens for browser events allowing progressive web apps (PWAs) to be installed.
     * Chavah is a progressive web app that users can install to their device.
     * For more info, see https://developers.google.com/web/fundamentals/app-install-banners
     * */
    export class PwaInstallService {

        private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
        private hasShownPrompt = false;

        constructor() {
            // Browsers will trigger this event when it deems appropriate (e.g. the user has used our app often).
            window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
                // Prevent Chrome 67 and earlier from automatically showing the prompt
                e.preventDefault();
                // Stash the event so it can be triggered later.
                this.deferredInstallPrompt = e;
            });
        }

        get canInstall(): boolean {
            return !!this.deferredInstallPrompt && !this.hasShownPrompt;
        }

        install(): Promise<InstallPromptResult> | null {
            if (this.canInstall && !!this.deferredInstallPrompt) {
                // Show the prompt
                this.deferredInstallPrompt.prompt();

                // Wait for the user to respond to the prompt.
                return this.deferredInstallPrompt.userChoice;
            }

            // We can't install, so just return null.
            return null;
        }
    }
    
    App.service("pwaInstall", PwaInstallService);
}