﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using RavenDB.Identity;
using Raven.Client;
using BitShuva.Chavah.Models.Transformers;
using Raven.Client.Indexes;
using cloudscribe.Syndication.Models.Rss;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add application services.
            services.AddTransient<IEmailSender, EmailSender>();

            // Add RavenDB and identity.
            services
                .AddRavenDb(Configuration.GetConnectionString("RavenDbConnection")) // Create a RavenDB DocumentStore singleton.
                .AddRavenDbAsyncSession() // Create a RavenDB IAsyncDocumentSession for each request.
                .AddRavenDbIdentity<AppUser>(); // Use Raven for users and roles. AppUser is your class, a simple DTO to hold user data. See https://github.com/JudahGabriel/RavenDB.Identity/blob/master/Sample/Models/AppUser.cs

            // Install our RavenDB indexes and transformers.
            // TODO: Move this into a helper function, maybe an extension on services?
            var db = services.BuildServiceProvider()
                .GetRequiredService<IDocumentStore>();
            IndexCreation.CreateIndexes(typeof(Startup).Assembly, db);
            new SongNameTransformer().Execute(db);

            // Add RSS feed services.
            services.AddScoped<IChannelProvider, RssChannelProvider>();

            services.AddMvc();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseBrowserLink();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();

            app.UseAuthentication();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}