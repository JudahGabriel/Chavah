using System;

using Microsoft.Extensions.DependencyInjection;

using Quartz;
using Quartz.Spi;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Quartz.net job factory that creates jobs using the ASP.NET Core dependency injection container.
    /// </summary>
    /// <remarks>
    /// Courtesy of https://stackoverflow.com/a/42199955/536
    /// </remarks>
    public class QuartzJobFactoryWithIoC : IJobFactory
    {
        private readonly IServiceProvider svcProvider;

        public QuartzJobFactoryWithIoC(IServiceProvider svcProvider)
        {
            this.svcProvider = svcProvider;
        }

        public IJob NewJob(TriggerFiredBundle bundle, IScheduler scheduler)
        {
            var job = (IJob)svcProvider.GetRequiredService(bundle.JobDetail.JobType) as IJob;
            return job;
        }

        public void ReturnJob(IJob job)
        {
            if (job is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
    }
}
