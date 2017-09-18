using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RavenDB.Identity;

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
