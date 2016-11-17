namespace BitShuva.Chavah {
    export class AppNavService {

        static $inject = [
            "$location"
        ];

        constructor(private $location: ng.ILocationService) {

        }

        signIn() {
            this.$location.url("/signin");
        }

        register(attemptedEmail?: string) {
            if (attemptedEmail) {
                this.$location.url(`/register/${encodeURIComponent(attemptedEmail)}`)
            } else {
                this.$location.url("/register");
            }
        }

        createPassword(email: string) {
            this.$location.url(`/createpassword/${encodeURIComponent(email)}`);
        }

        password(email: string) {
            this.$location.url(`/password/${encodeURIComponent(email)}`);
        }
    }

    App.service("appNav", AppNavService);
}