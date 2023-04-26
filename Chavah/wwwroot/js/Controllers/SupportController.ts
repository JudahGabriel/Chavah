namespace BitShuva.Chavah {
    export class SupportController {
        name = "";
        email = "";
        message = "";
        isSaving = false;
        state: "unsubmitted" | "success" | "error" = "unsubmitted";

        static $inject = [
            "accountApi"
        ];

        constructor(
            private readonly accountApi: AccountService) {

            this.accountApi.signedInState
                .select(() => this.accountApi.currentUser)
                .subscribe(user => this.signedInUserChanged(user));

            if (accountApi.currentUser) {
                this.email = accountApi.currentUser.email;
            }
        }

        get canSubmit(): boolean {
            return !this.isSaving &&
                !!this.message && this.message.length > 0 &&
                !!this.email && this.email.length > 0 &&
                !!this.name && this.name.length > 0;
        }

        submit() {
            if (this.canSubmit) {
                this.isSaving = true;
                this.accountApi.sendSupportMessage(this.name, this.email, this.message, window.navigator.userAgent)
                    .then(() => this.state = "success", () => this.state = "error")
                    .finally(() => this.isSaving = false);
            }
        }

        signedInUserChanged(user: User | null) {
            if (user) {
                this.email = user.email;
            }
        }
    }

    App.controller("SupportController", SupportController);
}