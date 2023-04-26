var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var SignInStatus;
        (function (SignInStatus) {
            SignInStatus[SignInStatus["Success"] = 0] = "Success";
            SignInStatus[SignInStatus["LockedOut"] = 1] = "LockedOut";
            SignInStatus[SignInStatus["RequiresVerification"] = 2] = "RequiresVerification";
            SignInStatus[SignInStatus["Failure"] = 3] = "Failure";
            SignInStatus[SignInStatus["Pwned"] = 4] = "Pwned";
        })(SignInStatus = Chavah.SignInStatus || (Chavah.SignInStatus = {}));
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=SignInStatus.js.map