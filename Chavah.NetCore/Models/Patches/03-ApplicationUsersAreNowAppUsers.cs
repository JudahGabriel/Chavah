using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Patches
{
    /// <summary>
    /// Goes through all ApplicationUsers and instead stores an AppUser. 
    /// Necessary because in the move to .NET Core, our identity provider has changed shape.
    /// </summary>
    public class ApplicationUsersAreNowAppUsers : PatchBase
    {
        public ApplicationUsersAreNowAppUsers()
        {
            this.Number = 3;
            this.Collection = "ApplicationUsers";
            
            this.Script = @"
                var appUser = {
                    AccessFailedCount: this.AccessFailedCount,
                    Claims: [],
                    Email: this.Email,
                    EmailConfirmed: this.IsEmailConfirmed,
                    Id: 'AppUsers/' + this.Email,
                    IsPhoneNumberConfirmed: false,
                    LastSeen: this.LastSeen,
                    LockoutEnabled: false,
                    LockoutEndDate: null,
                    Logins: [],
                    Notifications: this.Notifications,
                    PasswordHash: this.PasswordHash,
                    PhoneNumber: null,
                    RecentSongIds: this.RecentSongIds,
                    RegistrationDate: this.RegistrationDate,
                    RequiresPasswordReset: this.RequiresPasswordReset,
                    SecurityStamp: this.SecurityStamp,
                    TotalPlays: this.TotalPlays,
                    TotalSongRequests: this.TotalSongRequests,
                    TwoFactorEnabled: false,
                    UserName: this.UserName
                };
                
                var appUserMeta = {
                    'Raven-Entity-Name': 'AppUsers',
                    'Raven-Clr-Type': 'BitShuva.Chavah.Models.AppUser, BitShuva.Chavah'
                };
                PutDocument(appUser.Id, appUser, appUserMeta);
";
        }
    }
}
