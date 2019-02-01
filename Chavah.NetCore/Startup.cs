using System;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using BitShuva.Services;
using cloudscribe.Syndication.Models.Rss;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Pwned.AspNetCore;
using Raven.Identity;
using Raven.Migrations;
using Raven.StructuredLog;

namespace BitShuva.Chavah
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        private readonly ILogger<Startup> _logger;

        public Startup(IConfiguration configuration, ILogger<Startup> logger)
        {
            Configuration = configuration;
            _logger = logger;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddOptions();
            services.Configure<AppSettings>(Configuration);

            // Add application services.
            services.AddTransient<IEmailService, SendGridEmailService>();
            services.AddTransient<IPushNotificationSender, PushNotificationSender>();
            services.AddTransient<ICdnManagerService, CdnManagerService>();
            services.AddScoped<IChannelProvider, RssChannelProvider>();
            services.AddTransient<ISongService, SongService>();
            services.AddTransient<ISongUploadService, SongUploadService>();
            services.AddTransient<IAlbumService, AlbumService>();
            services.AddTransient<IUserService, UserService>();

            services.AddBackgroundQueueWithLogging(1, TimeSpan.FromSeconds(5));
            services.AddEmailRetryService();
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
                .AddLogging(logger => logger.AddRavenStructuredLogger())
                .AddRavenDbMigrations(); // Add the migrations

            services.InstallIndexes();
            services.AddMemoryCache();

            services.AddApiVersioning(v =>
            {
                v.ReportApiVersions = true;
                v.AssumeDefaultVersionWhenUnspecified = true;
            });

            services.AddVersionedApiExplorer();

            services.AddMvc(c => c.Conventions.Add(new ApiExplorerIgnores()))
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2)
                .AddJsonOptions(options=>
                {
                    options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                    options.SerializerSettings.DefaultValueHandling = DefaultValueHandling.Include;
                    options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
                });

            services.AddAutoMapper();
            services.AddApiVersioning(o =>
            {
                o.ReportApiVersions = true;
                o.AssumeDefaultVersionWhenUnspecified = true;

                //https://github.com/Microsoft/aspnet-api-versioning/wiki/API-Version-Reader
                o.ApiVersionReader = ApiVersionReader.Combine(
                    //default api-version
                    new QueryStringApiVersionReader("v"),
                    //default Content-Type: application/json;v=2.0
                    //Content-Type: application/json;version=2.0
                    new MediaTypeApiVersionReader("version"),
                    new HeaderApiVersionReader("api-version", "api-v")
                    );
            });
            services.AddCustomAddSwagger();
            services.AddPwnedPassword(_=> new PwnedOptions());
            services.Configure<SecurityStampValidatorOptions>(options =>
            {
                // enables immediate logout, after updating the user's stat.
                options.ValidationInterval = TimeSpan.Zero;
            });
            services.AddAuthentication(options=>
            {
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

            }).AddCookie(o =>
            {
                o.Events.OnRedirectToLogin = (context) =>
                {
                    context.Response.StatusCode = 401;
                    return Task.CompletedTask;
                };
            });
            services.AddHttpsRedirection(options => options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect );
            services.AddAuthorization(options => options.AddPolicy(Policies.Administrator, policy => policy.RequireRole(AppUser.AdminRole)));

            // Enable GZip and Brotli compression.
            services.Configure<GzipCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Optimal;
            });
            services.Configure<BrotliCompressionProviderOptions>(options =>
            {
                options.Level = System.IO.Compression.CompressionLevel.Fastest;
            });

            services.AddResponseCompression(options =>
            {
                options.EnableForHttps = true;
                options.Providers.Add<BrotliCompressionProvider>();
                options.Providers.Add<GzipCompressionProvider>();
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(
            IApplicationBuilder app,
            IHostingEnvironment env,
            ILoggerFactory loggerFactory,
            IApiVersionDescriptionProvider provider)
        {
            // Compression must be specified before .UseStaticFiles, otherwise static files won't be compressed. https://stackoverflow.com/questions/46832723/net-core-response-compression-middleware-for-static-files
            app.UseResponseCompression();

            if (env.IsDevelopment())
            {
                // Static files without caching.
                app.UseStaticFiles();
            }
            else
            {
                // Static files with heavy caching.
                // We set immutable (for new browsers) and a 60 day cache time.
                // We use ?v= query string to cache bust out-of-date files, so this works quite nicely.
                app.UseStaticFiles(new StaticFileOptions
                {
                    OnPrepareResponse = ctx =>
                    {
                        ctx.Context.Response.Headers[Microsoft.Net.Http.Headers.HeaderNames.CacheControl] =
                            "immutable,public,max-age=" + TimeSpan.FromDays(60).TotalSeconds;
                    }
                });
            }

            app.UseHttpsRedirection();
            app.UseAuthentication();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });

            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                foreach (var description in provider.ApiVersionDescriptions)
                {
                    options.SwaggerEndpoint(
                        $"/swagger/{description.GroupName}/swagger.json",
                        description.GroupName.ToUpperInvariant());
                }
            });


            // Run pending Raven migrations.
            var migrationService = app.ApplicationServices.GetService<MigrationRunner>();
            migrationService.Run();
        }
    }
}
