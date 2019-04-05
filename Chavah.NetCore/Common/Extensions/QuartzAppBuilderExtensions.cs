﻿using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Quartz;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Common
{
    public static class QuartzAppBuilderExtensions
    {
        /// <summary>
        /// Uses Quartz.NET to schedule retry of failed emails.
        /// </summary>
        /// <param name="app"></param>
        /// <returns></returns>
        public static IApplicationBuilder UseQuartzForEmailRetry(this IApplicationBuilder app)
        {
            // Use our QuartzJobFactoryWithIoC so that EmailRetryJob can be instantiated with dependencies.
            var scheduler = Quartz.Impl.StdSchedulerFactory.GetDefaultScheduler().Result;
            scheduler.JobFactory = new QuartzJobFactoryWithIoC(app.ApplicationServices);
            var emailSettings = app.ApplicationServices.GetRequiredService<IOptions<AppSettings>>();

            var retryJob = JobBuilder.Create<EmailRetryJob>().Build();
            var retryTrigger = TriggerBuilder.Create()
                .StartAt(DateTimeOffset.Now.AddMinutes(5))
                .WithSimpleSchedule(x => x.WithIntervalInMinutes(emailSettings.Value.Email.RetryFailedEmailTimeInMinutes).RepeatForever())
                .Build();

            scheduler.ScheduleJob(retryJob, retryTrigger).Wait();
            scheduler.Start();
            return app;
        }
    }
}
