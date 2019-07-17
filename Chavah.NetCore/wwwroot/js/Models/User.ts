namespace BitShuva.Chavah {
    export class User implements Server.IUserViewModel {
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

        constructor(serverObj: Server.IUserViewModel) {
            angular.merge(this, serverObj);
        }

        get isAdmin(): boolean {
            if (this.roles === undefined) {
                return false;
            }
            return this.roles.map(v=> v.toLowerCase()).includes(User.roles.admin.toLowerCase());
        }

        get displayName(): string {
            if (this.firstName && this.lastName) {
                return `${this.firstName} ${this.lastName}`;
            }

            return this.email.substring(0, this.email.indexOf('@'));
        }

        updateFrom(other: Server.IUserViewModel) {
            angular.merge(this, other);
        }
    }
}
