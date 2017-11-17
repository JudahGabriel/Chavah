using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebOptimizer.AngularTemplateCache;

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
                pipeline.AddCssBundle("/css/app-styles.css", new[]
                {
                    "css/bootswatch.min.css",
                    "css/bootstrap-flatly.min.css",
                    "css/bootstrap-flatly-tweaks.min.css",
                    "css/nprogress.min.css",
                    "css/app/*.min.less"
                });

                //bundles.Add(new StyleBundle("~/bundles/bootstrap-theme")
                //.Include("~/Content/styles/bootswatch.css")
                //.Include("~/Content/styles/bootstrap.flatly.min.css")
                //.Include("~/Content/styles/bootstrap.flatly.tweaks.css"));

                //pipeline.AddHtmlTemplateBundle("/bundles/app-templates-core.js",
                //                                new AngularTemplateOptions { moduleName = "app-templates-main", templatePath = "/App/Views/" },
                //                                "App/Views/*.html")
                //                                .UseContentRoot();

                //pipeline.AddHtmlTemplateBundle("/bundles/app-templates.js",
                //                                new AngularTemplateOptions { moduleName = "app-templates", templatePath = "/App/Views/Templates/" },
                //                                "App/Views/Templates/*.html")
                //                               .UseContentRoot();
            });
        }
    }
}
