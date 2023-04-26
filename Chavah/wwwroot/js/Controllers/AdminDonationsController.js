var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AdminDonationsController = /** @class */ (function () {
            function AdminDonationsController(artistApi) {
                var _this = this;
                this.artistApi = artistApi;
                this.minimum = 5;
                this.dueDonations = new Chavah.List(function () { return _this.artistApi.getDueDonations(_this.minimum); });
                this.currentTab = "pending";
                this.donationAmount = 0;
                this.donationDisbursementMonth = new Date();
                this.disburseDonationButtonText = "Disburse";
                this.isDisbursing = false;
                this.hasDisbursed = false;
            }
            AdminDonationsController.prototype.$onInit = function () {
                this.dueDonations.fetch();
            };
            AdminDonationsController.prototype.friendlyDate = function (dateIso) {
                return moment(dateIso)
                    .local()
                    .format("MMM D YYYY");
            };
            AdminDonationsController.prototype.markAsPaid = function (donation) {
                var _this = this;
                this.artistApi.markDueDonationAsPaid(donation)
                    .then(function () { return _this.dueDonations.remove(donation); });
            };
            AdminDonationsController.prototype.disburseDonations = function () {
                var _this = this;
                if (this.canDisburse) {
                    if (this.disburseDonationButtonText === "Disburse") {
                        this.disburseDonationButtonText = "Are you sure?";
                    }
                    else {
                        var oneBasedMonth = this.donationDisbursementMonth.getMonth() + 1;
                        this.isDisbursing = true;
                        this.artistApi.recordMessiahsMusicFundMonthlyDisbursement(this.donationDisbursementMonth.getFullYear(), oneBasedMonth, this.donationAmount)
                            .finally(function () {
                            _this.isDisbursing = false;
                            _this.disburseDonationButtonText = "Disburse";
                        });
                    }
                }
            };
            Object.defineProperty(AdminDonationsController.prototype, "canDisburse", {
                get: function () {
                    return this.donationAmount > 0 && this.donationDisbursementMonth <= new Date() && !this.isDisbursing;
                },
                enumerable: false,
                configurable: true
            });
            AdminDonationsController.$inject = [
                "artistApi"
            ];
            return AdminDonationsController;
        }());
        Chavah.AdminDonationsController = AdminDonationsController;
        Chavah.App.controller("AdminDonationsController", AdminDonationsController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AdminDonationsController.js.map