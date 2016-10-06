using Newtonsoft.Json.Serialization;
using System.Net.Http.Formatting;
using System.Web.Http;
using System.Linq;

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

            // Use camelCasing when returning results from the API.
            config.Formatters.OfType<JsonMediaTypeFormatter>().First().SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
        }
    }
}