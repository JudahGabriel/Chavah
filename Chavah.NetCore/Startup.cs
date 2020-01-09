﻿using System;
using System.IO.Compression;
using System.Net.Http;
using System.Threading.Tasks;

using AutoMapper;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;
using BitShuva.Chavah.Services;
using BitShuva.Services;

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

using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

using Polly;

using Raven.DependencyInjection;
using Raven.Identity;
using Raven.Migrations;
using Raven.StructuredLog;
using Microsoft.Extensions.Hosting;

namespace BitShuva.Chavah
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(
            IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<AppSettings>(Configuration.GetSection("App"));
            services.Configure<EmailSettings>(Configuration.GetSection("Email"));
            services.Configure<CdnSettings>(Configuration.GetSection("Cdn"));

            var hcBuilder = services.AddHealthChecks();

            hcBuilder.AddRavenDbCheck(tags: new string[] {"database"});
            hcBuilder.AddMemoryHealthCheck(tags: new string[] { "memory" });

            // Add application services.
            services.AddTransient<IEmailService, SendGridEmailService>();
            services.AddTransient<IPushNotificationSender, PushNotificationSender>();
            services.AddTransient<ICdnManagerService, BunnyCdnManagerService>();
            services.AddTransient<ISongService, SongService>();
            services.AddTransient<ISongUploadService, SongUploadService>();
            services.AddTransient<IAlbumService, AlbumService>();
            services.AddTransient<IUserService, UserService>();
            services.AddTransient<EmailRetryJob>();
            services.AddSingleton<BunnyCdnHttpClient>();

            services.AddBackgroundQueueWithLogging(1, TimeSpan.FromSeconds(5));
            services.AddCacheBustedAngularViews("/views");

            // Use BCrypt for password hashing. Must be added before AddIdentity().
            services.AddTransient<BCryptPasswordSettings>();
            services.AddScoped<IPasswordHasher<AppUser>, BCryptPasswordHasher<AppUser>>();

            // Add RavenDB and identity.
            services
                .AddChavahRavenDbDocStore(Configuration)       // Create a RavenDB DocumentStore singleton.
                .AddRavenDbAsyncSession()   // Create a RavenDB IAsyncDocumentSession for each request.
                .AddRavenDbMigrations()     // Use RavenDB migrations
                .AddRavenDbIdentity<AppUser>(c => // Use Raven for users and roles.
                {
                    c.Password.RequireNonAlphanumeric = false;
                    c.Password.RequireUppercase = false;
                    c.Password.RequiredLength = 6;
                });

            services.AddLogging(logger => logger.AddRavenStructuredLogger());

            services.InstallIndexes();
            services.AddMemoryCache();

            services.AddApiVersioning(v =>
            {
                v.ReportApiVersions = true;
                v.AssumeDefaultVersionWhenUnspecified = true;
            });

            services.AddVersionedApiExplorer();
            services.AddControllersWithViews(c => c.Conventions.Add(new ApiExplorerIgnores()));
            services.AddAutoMapper(typeof(Startup).Assembly);
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

            //services.AddPwnedPassword();

            services.AddPwnedPasswordHttpClient(Configuration)
                  .AddTransientHttpErrorPolicy(p => p.RetryAsync(3))
                  .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(2)));

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

            services.AddHttpsRedirection(options => options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect);
            services.AddAuthorization(options => options.AddPolicy(Policies.Administrator, policy => policy.RequireRole(AppUser.AdminRole)));

            // Enable GZip and Brotli compression.
            services.Configure<GzipCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Fastest;
            });
            services.Configure<BrotliCompressionProviderOptions>(options =>
            {
                options.Level = CompressionLevel.Fastest;
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
            IWebHostEnvironment env,
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

            app.UseHealthyHealthCheck();

            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(endpoints => endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}"));

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

            // Use our EmailRetryService
            app.UseQuartzForEmailRetry();

            // Run pending Raven migrations.
            var migrationService = app.ApplicationServices.GetService<MigrationRunner>();
            migrationService.Run();
        }
    }
}
