namespace BitShuva.Chavah {
    export interface InitConfig {
        debug: boolean;
        songId: string | null;
        redirect: string | null;
        userEmail: string | null;
        userRoles: string[];
        embed: Boolean;
    }
}