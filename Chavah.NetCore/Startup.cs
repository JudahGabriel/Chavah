using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Indexes;
using BitShuva.Chavah.Models.Patches;
using BitShuva.Chavah.Services;
using BitShuva.Services;
using cloudscribe.Syndication.Models.Rss;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Raven.Identity;
using Raven.StructuredLog;
using System;

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
            services.AddOptions();
            services.Configure<AppSettings>(Configuration);

            // Add application services.
            services.AddTransient<IEmailSender, SendGridEmailService>();
            services.AddTransient<ICdnManagerService, CdnManagerService>();
            services.AddScoped<IChannelProvider, RssChannelProvider>();
            services.AddTransient<ISongService, SongService>();
            services.AddTransient<ISongUploadService, SongUploadService>();
            services.AddTransient<IAlbumService, AlbumService>();
            services.AddTransient<IUserService, UserService>();
            services.AddCacheBustedAngularViews("/views");

            // Use our BCrypt for password hashing. Must be added before AddIdentity().
            services.AddTransient<BCryptPasswordSettings>();
            services.AddScoped<IPasswordHasher<AppUser>, BCryptPasswordHasher<AppUser>>();

            // Add RavenDB and identity.
            services
                .AddRavenDocStore() // Create a RavenDB DocumentStore singleton.
                .AddRavenDbAsyncSession() // Create a RavenDB IAsyncDocumentSession for each request.
                .AddRavenDbIdentity<AppUser>(c => // Use Raven for users and roles. 
                {
                    c.Password.RequireNonAlphanumeric = false;
                    c.Password.RequireUppercase = false;
                    c.Password.RequiredLength = 6;
                })
                .AddLogging(logger => logger.AddRavenStructuredLogger());

            services.RunDatabasePatches();
            services.InstallIndexes();
            services.AddMemoryCache();
            services.AddMvc();
            services.UseBundles(); // Must be *after* .AddMvc()
            services.AddProgressiveWebApp();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            System.AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
            {
                Console.WriteLine("Unhandled exception. Terminating = {0}. Exception details: {1}", e?.IsTerminating, e?.ExceptionObject?.ToString());
                Console.Out.Flush();
            };
            

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

            app.UseWebOptimizer(); // this line must come before .UseStaticFiles()
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
