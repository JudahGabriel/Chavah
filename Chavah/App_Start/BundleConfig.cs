using System;
using System.Web.Optimization;

namespace BitShuva
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            //bundles.IgnoreList.Clear();
            //AddDefaultIgnorePatterns(bundles.IgnoreList);
            
            var cdns = new
            {
                JQuery = "https://code.jquery.com/jquery-2.2.4.min.js",
                Bootstrap = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js",
                Moment = "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.13.0/moment.min.js",
                Angular = "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.7/angular.min.js",
                AngularAnimate = "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.7/angular-animate.min.js",
                AngularRoute = "https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.7/angular-route.min.js",
                AngularLocalStorage = "https://cdnjs.cloudflare.com/ajax/libs/angular-local-storage/0.5.0/angular-local-storage.js",
                FastClick = "https://cdn.jsdelivr.net/fastclick/1.0.6/fastclick.min.js",
                AngularBootstrap = "https://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/1.3.3/ui-bootstrap.min.js",
                AngularBootstrapTemplates = "https://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/1.3.3/ui-bootstrap-tpls.min.js",
                NProgress = "https://cdn.jsdelivr.net/nprogress/0.1.6/js/nprogress.min.js",
                RxLite = "https://cdnjs.cloudflare.com/ajax/libs/rxjs/4.1.0/rx.lite.js",
                Vibrant = "https://cdnjs.cloudflare.com/ajax/libs/vibrant.js/1.0.0/Vibrant.min.js",
                TinyColor = "https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.4.1/tinycolor.min.js",
                //Lodash = "https://cdn.jsdelivr.net/lodash/4.13.1/lodash.min.js"
            };

            bundles.Add(new ScriptBundle("~/bundles/jquery", cdns.JQuery).Include("~/Scripts/jquery-{version}.js"));
            bundles.Add(new ScriptBundle("~/bundles/bootstrap", cdns.Bootstrap).Include("~/Scripts/bootstrap.min.js"));
            bundles.Add(new ScriptBundle("~/bundles/moment", cdns.Moment).Include("~/Scripts/moment.min.js"));
            bundles.Add(new ScriptBundle("~/bundles/angular", cdns.Angular).Include("~/Scripts/angular.js"));
            bundles.Add(new ScriptBundle("~/bundles/angular-animate", cdns.AngularAnimate).Include("~/Scripts/angular-animate.js"));
            bundles.Add(new ScriptBundle("~/bundles/angular-route", cdns.AngularRoute).Include("~/Scripts/angular-route.js"));
            bundles.Add(new ScriptBundle("~/bundles/angular-bootstrap", cdns.AngularBootstrap).Include("~/Scripts/angular-ui/ui-bootstrap.min.js"));
            bundles.Add(new ScriptBundle("~/bundles/angular-bootstrap-templates", cdns.AngularBootstrapTemplates).Include("~/Scripts/angular-ui/ui-bootstrap-tpls.min.js"));
            bundles.Add(new ScriptBundle("~/bundles/angular-local-storage", cdns.AngularLocalStorage).Include("~/Scripts/angular-local-storage.js"));
            bundles.Add(new ScriptBundle("~/bundles/fastclick", cdns.FastClick).Include("~/Scripts/fastclick.js"));
            bundles.Add(new ScriptBundle("~/bundles/nprogress", cdns.NProgress).Include("~/Scripts/nprogress.min.js"));
            bundles.Add(new ScriptBundle("~/bundles/rx-lite", cdns.RxLite).Include("~/Scripts/rx.lite.js"));
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include("~/Scripts/modernizr-production.js"));
            bundles.Add(new ScriptBundle("~/bundles/vibrant").Include("~/Scripts/vibrant.min.js"));
            bundles.Add(new ScriptBundle("~/bundles/tinycolor").Include("~/Scripts/tinycolor.min.js"));
            //bundles.Add(new ScriptBundle("~/bundles/lodash", cdns.Lodash).Include("~/Scripts/lodash.min.js"));

            bundles.Add(new ScriptBundle("~/bundles/app")
                .Include("~/App/Polyfills/*.js", "~/App/Common/*.js", "~/App/Models/*.js") // Include polyfills, common, and models before any other app code.
                .Include("~/App/App.js", new AngularViewCacheBuster()) // Cache bust the references to our Angular views listed inside App.ts
                .Include(new[]
                {
                    "~/App/Controllers/*.js",
                    "~/App/Directives/*.js",
                    "~/App/Services/*.js"
                }));

            bundles.Add(new StyleBundle("~/bundles/bootstrap-theme")
                .Include("~/Content/styles/bootswatch.css")
                .Include("~/Content/styles/bootstrap.flatly.min.css")
                .Include("~/Content/styles/bootstrap.flatly.tweaks.css"));
            bundles.Add(new StyleBundle("~/bundles/app-styles")
                .Include(new[]
                {
                    "~/Content/styles/app/*.css",
                    "~/Content/styles/nprogress.css"
                }));

#if DEBUG
            BundleTable.EnableOptimizations = false;
            bundles.UseCdn = false;
#else
            BundleTable.EnableOptimizations = true;
            bundles.UseCdn = true;
#endif
        }

        public static void AddDefaultIgnorePatterns(IgnoreList ignoreList)
        {
            if (ignoreList == null)
            {
                throw new ArgumentNullException("ignoreList");
            }

            ignoreList.Ignore("*.intellisense.js");
            ignoreList.Ignore("*-vsdoc.js");
            ignoreList.Ignore("*.debug.js", OptimizationMode.WhenEnabled);
            //ignoreList.Ignore("*.min.js", OptimizationMode.WhenDisabled);
            //ignoreList.Ignore("*.min.css", OptimizationMode.WhenDisabled);
        }
    }
}