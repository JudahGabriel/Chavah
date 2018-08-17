namespace BitShuva.Chavah {
    export class User implements Server.UserViewModel {
        totalPlays: number;
        registrationDate: string;
        lastSeen: string;
        totalSongRequests: number;
        requiresPasswordReset: boolean;
        recentSongIds: string[];
        notifications: Server.Notification[];
        volume: number;
        profilePicUrl: string | null;
        firstName: string;
        lastName: string;

        accessFailedCount: number;
        claims: any[];
        email: string;
        id: string;
        userName: string;
        emailConfirmed: boolean;
        isPhoneNumberConfirmed: boolean;
        lockoutEnabled: boolean;
        lockoutEndDate: string | null;
        twoFactorEnabled: boolean;
        phoneNumber: string;
        roles: string[];

        static readonly roles = {
            admin: "admin"
        };

        constructor(serverObj: Server.UserViewModel) {
            angular.merge(this, serverObj);
        }

        get isAdmin(): boolean {
            return this.roles.includes(User.roles.admin);
        }

        updateFrom(other: Server.UserViewModel) {
            angular.merge(this, other);
        }
    }
}
