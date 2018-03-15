using BitShuva.Chavah.Services;
using Microsoft.Extensions.DependencyInjection;
using Quartz;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public static class EmailRetryServiceProvider
    {
        /// <summary>
        /// Sets up an email retry service that looks in Raven for failed emails and attempts to resend them.
        /// </summary>
        /// <param name="svc"></param>
        /// <returns></returns>
        public static IServiceCollection AddEmailRetryService(this IServiceCollection svc)
        {
            EmailRetryJob.Initialize(svc);
            var retryJob = JobBuilder.Create<EmailRetryJob>()
                .Build();
            var retryTrigger = TriggerBuilder.Create()
                .StartNow()
                .WithSimpleSchedule(x => x.WithIntervalInMinutes(30).RepeatForever())
                .Build();
            var scheduler = Quartz.Impl.StdSchedulerFactory.GetDefaultScheduler().Result;
            scheduler.ScheduleJob(retryJob, retryTrigger).Wait();
            scheduler.Start();
            return svc;
        }
    }
}
