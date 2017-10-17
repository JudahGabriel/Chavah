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
                                                new AngularTemplateOptions { moduleName = "app-templates-main", templatePath = "/App/Views/" },
                                                "App/Views/*.html")
                                                .UseContentRoot();

                pipeline.AddHtmlTemplateBundle("/bundles/app-templates.js",
                                                new AngularTemplateOptions { moduleName = "app-templates", templatePath = "/App/Views/Templates/" },
                                                "App/Views/Templates/*.html")
                                               .UseContentRoot();
            });
        }
    }
}
