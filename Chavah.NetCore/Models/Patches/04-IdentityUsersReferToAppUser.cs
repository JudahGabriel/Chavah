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
            this.Number = 4;
            this.Collection = "IdentityUserByUserNames";
            this.Script = @"
                this.UserId = this.UserId.replace('ApplicationUsers', 'AppUsers');
                this['@metadata']['Raven-Clr-Type'] = 'RavenDB.Identity.IdentityUserByUserName, RavenDB.Identity';
";
        }
    }
}
