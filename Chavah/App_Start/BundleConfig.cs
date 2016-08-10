using System;
using System.Web.Optimization;

namespace BitShuva
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();
            bundles.UseCdn = true;
            AddDefaultIgnorePatterns(bundles.IgnoreList);

            bundles.Add(new ScriptBundle("~/scripts/jquery", "https://code.jquery.com/jquery-2.1.4.min.js")
                .Include("~/Scripts/jquery-{version}.js"));
            bundles.Add(new ScriptBundle("~/scripts/reactive", "https://cdnjs.cloudflare.com/ajax/libs/rxjs/4.0.7/rx.lite.js")
                .Include("~/Scripts/rx.lite.js"));

            bundles.Add(new ScriptBundle("~/scripts/app").Include(
                  new[]
                  {
                      "~/Scripts/angular.js",
                      "~/Scripts/angular-route.js",
                      "~/Scripts/angular-touch.js",
                      "~/Scripts/angular-animate.js",
                      "~/Scripts/angular-ui/ui-bootstrap.js",
                      "~/Scripts/angular-ui/ui-bootstrap-tpls.js",
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/moment.js",
                      "~/Scripts/nprogress.js",
                      "~/Scripts/rx.lite.min.js",
                      "~/Scripts/vibrant.min.js",
                      "~/Scripts/modernizr-production.js",
                      "~/App/App.js",
                      "~/App/Models/*.js",
                      "~/App/Services/*.js",
                      "~/App/Controllers/*.js"
                  }));

            bundles.Add(new StyleBundle("~/styles/fontawesome", "https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css")
                .Include("~/Content/font-awesome.css"));

            bundles.Add(
              new StyleBundle("~/styles/app")
                .Include("~/Content/nprogress.css")
                .Include("~/Content/bootstrap.flatly.css") // Don't use CDN, because this is a customized theme
                .Include("~/Content/app.css")
              );

#if DEBUG
            bundles.UseCdn = false;
            BundleTable.EnableOptimizations = false;
#else
            bundles.UseCdn = true;
            BundleTable.EnableOptimizations = true;
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