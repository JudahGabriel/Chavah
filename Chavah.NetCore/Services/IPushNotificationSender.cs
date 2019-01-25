using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BitShuva.Chavah.Models;

namespace BitShuva.Chavah.Services
{
    public interface IPushNotificationSender
    {
        /// <summary>
        /// Queues a notification to be sent to the specified recipients.
        /// </summary>
        /// <param name="notification"></param>
        /// <param name="recipients"></param>
        void QueueSendNotification(PushNotification notification, List<PushSubscription> recipients);

        /// <summary>
        /// Queues a notification to be sent to all push notification subscribers.
        /// </summary>
        /// <param name="notification"></param>
        void QueueSendNotificationToAll(PushNotification notification);
    }
}