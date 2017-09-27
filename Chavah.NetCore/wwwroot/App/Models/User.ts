namespace BitShuva.Chavah {
    export class User {
        readonly isAdmin: boolean;

        constructor(public email: string, public roles: string[]) {
            this.isAdmin = roles && roles.includes("Admin")
        }
    }
}