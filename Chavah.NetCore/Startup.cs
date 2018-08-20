using System;
using System.Threading.Tasks;
using AutoMapper;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Patches;
using BitShuva.Chavah.Services;
using BitShuva.Services;
using cloudscribe.Syndication.Models.Rss;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Pwned.AspNetCore;
using Raven.Identity;
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
                .AddLogging(logger => logger.AddRavenStructuredLogger());

            services.RunDatabasePatches();
            services.InstallIndexes();
            services.AddMemoryCache();

            services.AddMvcCore().AddVersionedApiExplorer(
              options =>
              {
                  options.GroupNameFormat = "'v'VVV";

                   // note: this option is only necessary when versioning by url segment. the SubstitutionFormat
                   // can also be used to control the format of the API version in route templates
                   options.SubstituteApiVersionInUrl = true;
              });

            services.AddMvc(c => c.Conventions.Add(new ApiExplorerIgnores()))
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_1)
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

            services.AddProgressiveWebApp();

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


            services.AddAuthorization(options => options.AddPolicy(Policies.Administrator, policy => policy.RequireRole(AppUser.AdminRole)));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env,
            ILoggerFactory loggerFactory,
            IApiVersionDescriptionProvider provider)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
            {
                _logger.LogError($"Unhandled exception. Terminating = {e?.IsTerminating}. Exception details: {e?.ExceptionObject?.ToString()}");
            };
            

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
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

        }
    }
}
