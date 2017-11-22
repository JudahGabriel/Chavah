using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Patches
{
    public class IdentityUsersReferToAppUser : PatchBase
    {
        public IdentityUsersReferToAppUser()
        {
            // old: 
            //"Raven-Entity-Name": "IdentityUserByUserNames",
            //"Raven-Clr-Type": "RavenDB.AspNet.Identity.IdentityUserByUserName, RavenDB.AspNet.Identity"

            this.Number = 4;
            this.Collection = "IdentityUserByUserNames";
            this.Script = @"
                this.UserId = this.UserId.replace('ApplicationUsers', 'AppUsers').replace('applicationUsers', 'appUsers').replace('applicationusers', 'appusers');
                this['@metadata']['Raven-Clr-Type'] = 'RavenDB.Identity.IdentityUserByUserName, RavenDB.Identity';
";
        }
    }
}
