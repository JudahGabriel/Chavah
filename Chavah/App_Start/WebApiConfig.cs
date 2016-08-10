using System.Web.Http;

namespace BitShuva
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();
            config.Routes.MapHttpRoute(
              name: "DefaultApi",
              routeTemplate: "api/{controller}/{id}",
              defaults: new { id = RouteParameter.Optional }
              );

            config.Filters.Add(new BitShuva.Common.ElmahUnhandledExceptionFilter());
        }
    }
}