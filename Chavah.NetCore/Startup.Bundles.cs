using Microsoft.Extensions.DependencyInjection;

namespace BitShuva.Chavah
{
    public static class Bundles
    {
       public static void UseBundles(this IServiceCollection services)
        {
            services.AddWebOptimizer(pipeline =>
            {
                pipeline.AddJavaScriptBundle("/bundles/app.js", new[]
                {
                    "js/polyfills/*.js",
                    "js/common/*.js",
                    "js/models/*.js",
                    "js/app.js",
                    "js/directives/*.js",
                    "js/services/*.js",
                    "js/controllers/*.js"
                });
                pipeline.AddCssBundle("/bundles/app.css", new[]
                {
                    "css/bootswatch.min.css",
                    "css/bootstrap-flatly.min.css",
                    "css/bootstrap-flatly-tweaks.min.css",
                    "css/nprogress.min.css",
                    "css/app/*.min.css"
                });

            });
        }
    }
}
