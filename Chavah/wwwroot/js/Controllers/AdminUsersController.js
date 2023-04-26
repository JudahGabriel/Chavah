var BitShuva;
(function (BitShuva) {
    var Chavah;
    (function (Chavah) {
        var AdminUsersController = /** @class */ (function () {
            function AdminUsersController(userApi, adminScripts) {
                this.userApi = userApi;
                this.adminScripts = adminScripts;
                this.timeframes = [
                    { title: "Last week", value: 7 },
                    { title: "Last month", value: 30 },
                    { title: "Last 3 months", value: 30 * 3 },
                    { title: "Last 6 months", value: 30 * 6 },
                    { title: "Last year", value: 365 },
                    { title: "Last 5 years", value: 365 * 5 }
                ];
                this.activeTimeframe = this.timeframes[0];
            }
            AdminUsersController.prototype.$onInit = function () {
                var _this = this;
                this.loadGoogleCharts()
                    .then(function () { return _this.changeTimeframe(_this.timeframes[0]); });
            };
            AdminUsersController.prototype.loadGoogleCharts = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var chartsExist = function () { return !!window["google"] && !!window["google"]["charts"]; };
                    return _this.adminScripts.installScript("https://www.gstatic.com/charts/loader.js", chartsExist)
                        .then(function () {
                        google.charts.load("current", { "packages": ["line"] });
                        google.charts.setOnLoadCallback(function () { return resolve(); });
                    }, function (error) { return reject(error); });
                });
            };
            AdminUsersController.prototype.drawChart = function (users) {
                var chartData = this.usersToChartData(users);
                var options = {
                    chart: {
                        title: users.items.length + " new users",
                        subtitle: "in the " + this.activeTimeframe.title.toLowerCase()
                    },
                    width: 900,
                    height: 700
                };
                var chart = new google.charts["Line"](document.querySelector("#adminUsersChart"));
                chart.draw(chartData, google.charts["Line"].convertOptions(options));
            };
            AdminUsersController.prototype.changeTimeframe = function (timeframe) {
                var _this = this;
                this.activeTimeframe = timeframe;
                var timeAgo = moment.utc().subtract(timeframe.value, "days");
                var getUsersTask = this.userApi.getRegistrations(timeAgo.toISOString());
                getUsersTask.then(function (users) { return _this.drawChart(users); });
            };
            AdminUsersController.prototype.usersToChartData = function (users) {
                var data = new google.visualization.DataTable();
                data.addColumn("date", "Date");
                data.addColumn("number", "Users");
                var rows = users.items.map(function (user, index) {
                    // Assumes results are ordered from oldest to newest.
                    var usersOnDate = users.total - users.items.length + index;
                    var date = new Date(user.registrationDate);
                    return [date, usersOnDate];
                });
                data.addRows(rows);
                return data;
            };
            AdminUsersController.$inject = [
                "userApi",
                "adminScripts"
            ];
            return AdminUsersController;
        }());
        Chavah.AdminUsersController = AdminUsersController;
        Chavah.App.controller("AdminUsersController", AdminUsersController);
    })(Chavah = BitShuva.Chavah || (BitShuva.Chavah = {}));
})(BitShuva || (BitShuva = {}));
//# sourceMappingURL=AdminUsersController.js.map