namespace BitShuva.Chavah {
    export class SignInResult {
        status: SignInStatus;
        errorMessge: string | null;
        jsonWebToken: string | null;
        email: string | null;
        roles: string[];
    }
}