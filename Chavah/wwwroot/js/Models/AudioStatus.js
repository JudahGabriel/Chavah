var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AudioStatus;
        (function (AudioStatus) {
            AudioStatus[AudioStatus["Paused"] = 0] = "Paused";
            AudioStatus[AudioStatus["Playing"] = 1] = "Playing";
            AudioStatus[AudioStatus["Ended"] = 2] = "Ended";
            AudioStatus[AudioStatus["Erred"] = 3] = "Erred";
            AudioStatus[AudioStatus["Stalled"] = 4] = "Stalled";
            AudioStatus[AudioStatus["Buffering"] = 5] = "Buffering";
            AudioStatus[AudioStatus["Aborted"] = 6] = "Aborted";
        })(AudioStatus = Chavah.AudioStatus || (Chavah.AudioStatus = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AudioStatus.js.map