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

            // Add RavenDB and identity.
            services
                .AddRavenDb(Configuration.GetConnectionString("RavenConnection")) // Create a RavenDB DocumentStore singleton.
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

            services.AddTransient<ISongService, SongService>();
            services.AddTransient<IAlbumService, AlbumService>();
            services.AddTransient<IUserService, UserService>();

            services.AddMemoryCache();

            services.AddMvc();

            services.AddWebOptimizer(pipeline =>
            {
                //pipeline.AddTypeScriptBundle("/js/app.js", "App/**/*.ts")
                //        .UseContentRoot();

                pipeline.AddJavaScriptBundle("/bundles/app.js", "App/**/*.js")
                        .UseContentRoot();

                pipeline.AddLessBundle("/css/app-styles.css", "App/Css/**/*.less")
                        .UseContentRoot();



                pipeline.AddJavaScriptBundle("/js/angular.js",
                                            "lib/angular/angular.js",
                                            "lib/angular-animate/angular-animate.js",
                                            "lib/angular-route/angular-route.js",
                                            "lib/angular-local-storage/dist/angular-local-storage.js",
                                            "lib/angular-local-storage/dist/angular-local-storage.js",
                                            "lib/angular-bootstrap/ui-bootstrap.js",
                                            "lib/angular-bootstrap/ui-bootstrap-tpls.js");

                pipeline.AddJavaScriptBundle("/js/bootstrap.js", "lib/bootstrap/dist/js/bootstrap.js");

                pipeline.AddJavaScriptBundle("/js/jquery.js",
                                "lib/jquery/dist/jquery.js",
                                "lib/jquery-validation/dist/jquery.validate.js",
                                "lib/jquery-validation/dist/additional-methods.js",
                                "lib/jquery-validation-unobtrusive/jquery.validate.unobtrusive.js");

                pipeline.AddJavaScriptBundle("/js/bundle.js",
                                "lib/modernizr/modernizr.js",
                                "lib/nprogress/nprogress.js",
                                "lib/moment/moment.js",
                                "lib/fastclick/lib/fastclick.js",
                                "lib/rx.lite.js",
                                "lib/lodash/lodash.js",
                                 "lib/tinycolor/tinycolor.js");

                pipeline.AddHtmlTemplateBundle("/bundles/app-templates-core.js", 
                                                new AngularTemplateOptions { moduleName= "app-templates-main", templatePath= "App/Views/" },
                                                "App/Views/*.html")
                                                .UseContentRoot();

                pipeline.AddHtmlTemplateBundle("/bundles/app-templates.js",
                                                new AngularTemplateOptions { moduleName = "app-templates", templatePath = "App/Views/Templates/" },
                                                "App/Views/Templates/*.html")
                                               .UseContentRoot();
                //pipeline.MinifyJsFiles();
            });
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
