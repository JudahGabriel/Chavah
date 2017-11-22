using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Models.Patches
{
    public class LikesPointToAppUser : PatchBase
    {
        public LikesPointToAppUser()
        {
            this.Collection = "Likes";
            this.Number = 5;
            this.Script = @"
                this.UserId = this.UserId.replace('ApplicationUsers/', 'AppUsers/');
";
        }
    }
}
