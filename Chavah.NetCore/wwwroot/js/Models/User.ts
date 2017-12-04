namespace BitShuva.Chavah {
    export class User {
        readonly isAdmin: boolean;

        static readonly roles = {
            admin: "admin"
        };

        constructor(public email: string, public roles: string[]) {
            this.isAdmin = roles && roles.includes(User.roles.admin)
        }
    }
}