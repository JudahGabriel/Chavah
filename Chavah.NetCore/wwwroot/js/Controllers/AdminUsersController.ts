namespace BitShuva.Chavah {
    export class AdminUsersController {

        static $inject = [
            "userApi",
            "adminScripts"
        ];

        constructor(
            private readonly userApi: UserApiService,
            private readonly adminScripts: AdminScriptsService) {
        }

        $onInit() {
            const loadChartsTask = this.loadGoogleCharts();
            const yearAgo = moment.utc().subtract(6, "months");
            const getUsersTask = this.userApi.getRegistrations(yearAgo.toISOString());
            Promise.all([getUsersTask, loadChartsTask]).then(results => this.drawChart(results[0]));
        }

        loadGoogleCharts(): Promise<void> {
            return new Promise((resolve, reject) => {
                const chartsExist = () => !!window["google"] && !!window["google"]["charts"];
                return this.adminScripts.installScript("https://www.gstatic.com/charts/loader.js", chartsExist)
                    .then(() => {
                        google.charts.load("current", { "packages": ["line"] });
                        google.charts.setOnLoadCallback(() => resolve());
                    }, error => reject(error));
            });
        }

        drawChart(users: Server.PagedList<Server.User>) {
            const chartData = this.usersToChartData(users);
            var options = {
                chart: {
                    title: 'Total registered users',
                    subtitle: 'over the last 6 months'
                },
                width: 900,
                height: 700
            };

            const chart = new google.charts["Line"](document.querySelector("#adminUsersChart"));
            chart.draw(chartData, google.charts["Line"].convertOptions(options));
        }

        usersToChartData(users: Server.PagedList<Server.User>): google.visualization.DataTable {
            var data = new google.visualization.DataTable();
            data.addColumn("date", "Date");
            data.addColumn("number", "Users");

            const rows = users.items.map((user, index) => {
                // Assumes results are ordered from oldest to newest.
                const usersOnDate = users.total - users.items.length + index;
                const date = new Date(user.registrationDate);
                return [date, usersOnDate];
            });
            data.addRows(rows);
            return data;
        }
    }

    App.controller("AdminUsersController", AdminUsersController);
}
