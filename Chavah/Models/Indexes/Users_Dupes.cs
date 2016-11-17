using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Models.Indexes
{
    public class Users_Dupes : AbstractIndexCreationTask<User, UserDupe>
    {
        public Users_Dupes()
        {
            Map = users => from user in users
                           select new UserDupe
                           {
                               EmailAddress = user.EmailAddress,
                               UserIds = new List<string>(2) { user.Id },
                               Count = 1,
                               LastSeen = user.LastSeen
                           };

            Reduce = dupes => from dupe in dupes
                              group dupe by dupe.EmailAddress into g
                              select new UserDupe
                              {
                                  EmailAddress = g.Key,
                                  UserIds = g.SelectMany(i => i.UserIds).ToList(),
                                  Count = g.Sum(d => d.Count),
                                  LastSeen = g.First().LastSeen
                              };
        }
    }
}