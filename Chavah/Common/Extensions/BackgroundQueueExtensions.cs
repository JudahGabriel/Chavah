using System;

using DalSoft.Hosting.BackgroundQueue;
using DalSoft.Hosting.BackgroundQueue.DependencyInjection;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BitShuva.Chavah.Common
{
    /// <summary>
    /// Extends <see cref="IServiceCollection"/> to add a <see cref="BackgroundQueue"/> that logs background tasks using an <see cref="ILogger"/> instance.
    /// </summary>
    public static class BackgroundQueueWithLoggingProvider
    {
        /// <summary>
        /// Adds a <see cref="BackgroundQueue"/> that logs exceptions to an <see cref="ILogger"/> instance.
        /// </summary>
        /// <param name="svc"></param>
        /// <param name="maxOccurrenceCount">The max number of concurrent tasks.</param>
        /// <param name="waitBeforePickingUpTask">Wait time before picking up a new task. Should be 1 second or more.</param>
        /// <returns></returns>
        public static IServiceCollection AddBackgroundQueueWithLogging(this IServiceCollection svc, int maxOccurrenceCount, TimeSpan waitBeforePickingUpTask)
        {
            var logger = svc.BuildServiceProvider().GetService<ILogger<BackgroundQueue>>();
            var errorHandler = new Action<Exception>(e =>
            {
                if (logger != null)
                {
                    logger.LogError(e, "Error executing background task");
                }
                else
                {
                    Console.WriteLine("Error executing background task. {0}", e);
                }
            });
            svc.AddBackgroundQueue(errorHandler, maxOccurrenceCount, (int)waitBeforePickingUpTask.TotalMilliseconds);

            return svc;
        }
    }
}
