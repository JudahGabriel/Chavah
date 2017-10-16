namespace BitShuva.Chavah {
    export interface InitConfig {
        debug: boolean;
        songId: string | null;
        redirect: string | null;
        userEmail: string | null;
        userRoles: string[];
        notifications: Server.INotification[];
        jwt: string;
        embed: Boolean;
    }
}