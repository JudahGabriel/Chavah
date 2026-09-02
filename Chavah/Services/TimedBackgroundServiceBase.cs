using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using System;
using System.Threading;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Base class for a background service that executes code on a timer.
    /// </summary>
    public abstract class TimedBackgroundServiceBase : IHostedService, IDisposable
    {
        protected readonly ILogger logger;
        protected CancellationToken cancelToken;
        private Timer? timer = null;
        private readonly TimeSpan dueTime;
        private readonly TimeSpan intervalTime;

        /// <summary>
        /// Creates a new timed background service.
        /// </summary>
        /// <param name="dueTime">When the first run should execute.</param>
        /// <param name="intervalTime">How often runs should be repeated.</param>
        /// <param name="logger"></param>
        public TimedBackgroundServiceBase(
            TimeSpan dueTime,
            TimeSpan intervalTime,
            ILogger logger)
        {
            this.dueTime = dueTime;
            this.intervalTime = intervalTime;
            this.logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            timer = new Timer(async _ => await TryDoWorkAsync(), null, dueTime, intervalTime);
            cancelToken = cancellationToken;
            return Task.CompletedTask;
        }

        public async Task StopAsync(CancellationToken stoppingToken)
        {
            cancelToken = stoppingToken;
            if (timer != null)
            {
                await timer.DisposeAsync();
            }
        }

        public void Dispose()
        {
            timer?.Dispose();
        }

        /// <summary>
        /// Runs the service. This is called from a timer.
        /// </summary>
        /// <param name="cancelToken"></param>
        /// <returns></returns>
        public abstract Task DoWorkAsync(CancellationToken cancelToken);

        private async Task TryDoWorkAsync()
        {
            try
            {
                await DoWorkAsync(cancelToken);
            }
            catch (Exception error)
            {
                logger.LogError(error, "Error executing timed background service");
            }
        }
    }
}
