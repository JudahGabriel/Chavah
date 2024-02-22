namespace BitShuva.Chavah {
    export class AdminIOSLogsController {

        static $inject = [
            "iosAudioPlayer"
        ];

        iOSLogs = "";

        constructor(private readonly iosAudioPlayer: IOSAudioPlayer) {
        }

        $onInit() {
            this.refreshLogs();
        }

        refreshLogs() {
            this.iOSLogs = this.iosAudioPlayer.logs.join("\r\r");
        }
    }

    App.controller("AdminIOSLogsController", AdminIOSLogsController);
}
