using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RavenDB.Identity;
using Raven.Client;
using BitShuva.Chavah.Models.Transformers;
using Raven.Client.Indexes;
using cloudscribe.Syndication.Models.Rss;
using BitShuva.Chavah.Common;
using BitShuva.Services;
using WebOptimizer.AngularTemplateCache;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Http;
using System.IO;
using BitShuva.Chavah.Models.Patches;

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
            //Configuration settings
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

            // Add RavenDB and identity.
            services
                .AddRavenDb(Configuration.GetConnectionString("RavenConnection")) // Create a RavenDB DocumentStore singleton.
                .AddRavenDbAsyncSession() // Create a RavenDB IAsyncDocumentSession for each request.
                .AddRavenDbIdentity<AppUser>(c => // Use Raven for users and roles. 
                {
                    c.Password.RequireNonAlphanumeric = false;
                    c.Password.RequireUppercase = false;
                    c.Password.RequiredLength = 6;
                }); 

            // Install our RavenDB indexes and transformers.
            // TODO: Move this into a helper function, maybe an extension on services?
            var db = services.BuildServiceProvider()
                .GetRequiredService<IDocumentStore>();
            IndexCreation.CreateIndexes(typeof(Startup).Assembly, db);
            new SongNameTransformer().Execute(db);

            // Run any database patches.
            PatchBase.RunPendingPatches(services);
                        
            services.AddMemoryCache();
            services.AddMvc();
            services.UseBundles();
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
            app.UseWebOptimizer();
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
