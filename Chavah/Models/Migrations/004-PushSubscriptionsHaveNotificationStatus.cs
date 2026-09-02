using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Raven.Migrations;

namespace BitShuva.Chavah.Models.Migrations
{
    [Migration(4)]
    public class PushSubscriptionsHaveNotificationStatus: Migration
    {
        public override void Up()
        {
            PatchCollection(@"
                from PushSubscriptions
                update {
                    this.NotificationErrorMessage = null;
                    this.SuccessfulNotificationCount = 0;
                    this.FailedNotificationCount = 0;
                    this.Unsubscribed = false;
                }
            ");
        }
    }
}
