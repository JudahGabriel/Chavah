namespace BitShuva.Chavah {
    export class AdminUsersController {

        private timeframes: ToggleOption[] = [
            { title: "Last week", value: 7 },
            { title: "Last month", value: 30 },
            { title: "Last 3 months", value: 30 * 3 },
            { title: "Last 6 months", value: 30 * 6 },
            { title: "Last year", value: 365 },
            { title: "Last 5 years", value: 365 * 5 }
        ];
        private activeTimeframe = this.timeframes[0];

        static $inject = [
            "userApi",
            "adminScripts"
        ];

        constructor(
            private readonly userApi: UserApiService,
            private readonly adminScripts: AdminScriptsService) {
        }

        $onInit() {
            const loadChartsTask = this.loadGoogleCharts()
                .then(() => this.changeTimeframe(this.timeframes[0]));
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
                    title: `${users.items.length} new users`,
                    subtitle: `in the ${this.activeTimeframe.title.toLowerCase()}`
                },
                width: 900,
                height: 700
            };

            const chart = new google.charts["Line"](document.querySelector("#adminUsersChart"));
            chart.draw(chartData, google.charts["Line"].convertOptions(options));
        }

        changeTimeframe(timeframe: ToggleOption) {
            this.activeTimeframe = timeframe;
            const timeAgo = moment.utc().subtract(timeframe.value as number, "days");
            const getUsersTask = this.userApi.getRegistrations(timeAgo.toISOString());
            getUsersTask.then(users => this.drawChart(users));
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
