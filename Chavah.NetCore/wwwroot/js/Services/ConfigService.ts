namespace BitShuva.Chavah {
    export class ConfigService {

        static $inject = ["httpApi"];

        Configurations: Server.IConfigViewModel;

        loadConfig = new Rx.BehaviorSubject<boolean>(false);

        constructor(private httpApi: HttpApiService) {
            this.httpApi.query("/config.json")
                .then((result) => {
                    this.Configurations = result as Server.IConfigViewModel;
                    this.loadConfig.onNext(true);
                });
        }
     
    }

    App.service("configApi", ConfigService);
}