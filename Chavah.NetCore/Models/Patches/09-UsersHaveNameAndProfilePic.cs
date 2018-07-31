using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Patches
{
    public class UsersHaveNameAndProfilePic : PatchBase
    {
        public UsersHaveNameAndProfilePic()
        {
            this.Collection = "AppUsers";
            this.Number = 9;
            this.Script = @"
                this.FirstName = '';
                this.LastName = '';
                this.ProfilePicUrl = null;
";
        }
    }
}
