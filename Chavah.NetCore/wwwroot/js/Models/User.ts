namespace BitShuva.Chavah {
    export class User implements Server.AppUser {
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
        logins: any[];
        passwordHash: string;
        phoneNumber: string;
        roles: string[];
        securityStamp: string;
        twoFactorAuthEnabled: boolean;

        static readonly roles = {
            admin: "admin"
        };

        constructor(serverObj: Server.AppUser) {
            angular.merge(this, serverObj);
        }

        get isAdmin(): boolean {
            return this.roles.includes(User.roles.admin);
        }

        updateFrom(other: Server.AppUser) {
            angular.merge(this, other);
        }
    }
}
