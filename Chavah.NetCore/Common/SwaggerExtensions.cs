using System;
using System.IO;
using System.Linq;
using System.Reflection;

using BitShuva.Chavah;
using BitShuva.Chavah.Settings;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.PlatformAbstractions;

using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class SwaggerExtensions
    {
        /// <summary>
        /// Add this functionality after services.Mvc
        /// </summary>
        /// <param name="services"></param>
        /// <returns></returns>
        public static IServiceCollection AddCustomAddSwagger(this IServiceCollection services)
        {
            services.AddSwaggerGen(
                options =>
                {
                    options.DescribeAllEnumsAsStrings();
                    options.DescribeAllParametersInCamelCase();
                    // resolve the IApiVersionDescriptionProvider service
                    // note: that we have to build a temporary service provider here because one has not been created yet

                    var sp = services.BuildServiceProvider();

                    var apiProvider = sp.GetRequiredService<IApiVersionDescriptionProvider>();
                    var appOptions = sp.GetRequiredService<IOptionsMonitor<AppSettings>>().CurrentValue;
                    var emailOptions = sp.GetRequiredService<IOptionsMonitor<EmailSettings>>().CurrentValue;

                    // add a swagger document for each discovered API version
                    // note: you might choose to skip or document deprecated API versions differently
                    foreach (var description in apiProvider.ApiVersionDescriptions)
                    {
                        options.SwaggerDoc(
                            description.GroupName,
                            CreateInfoForApiVersion(description, appOptions, emailOptions));
                    }

                    // add a custom operation filter which sets default values
                    options.OperationFilter<SwaggerDefaultValues>();

                    // integrate xml comments
                    options.IncludeXmlComments(XmlCommentsFilePath);
                });

            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.SuppressConsumesConstraintForFormFileParameters = true;
                options.SuppressInferBindingSourcesForParameters = true;
                options.SuppressModelStateInvalidFilter = true;
            });

            return services;
        }

        private static string XmlCommentsFilePath
        {
            get
            {
                var basePath = PlatformServices.Default.Application.ApplicationBasePath;
                var fileName = $"{typeof(Startup).GetTypeInfo().Assembly.GetName().Name}.xml";
                return Path.Combine(basePath, fileName);
            }
        }

        private static Info CreateInfoForApiVersion(
            ApiVersionDescription description,
            AppSettings appOptions,
            EmailSettings emailOptions)
        {
            var info = new Info()
            {
                Title = $"{appOptions?.Name} API {description.ApiVersion}",
                Version = description.ApiVersion.ToString(),
                Description = $"{appOptions?.Title}",
                Contact = new Contact()
                {
                    Name = emailOptions?.SenderName,
                    Email = emailOptions?.SenderEmail
                },
                TermsOfService = "Nonprofit",
                License = new License() { Name = "MIT", Url = "https://opensource.org/licenses/MIT" }
            };

            if (description.IsDeprecated)
            {
                info.Description += " This API version has been deprecated.";
            }

            return info;
        }

        /// <summary>
        /// Represents the Swagger/Swashbuckle operation filter used to document the implicit API version parameter.
        /// </summary>
        /// <remarks>This <see cref="IOperationFilter"/> is only required due to bugs in the <see cref="SwaggerGenerator"/>.
        /// Once they are fixed and published, this class can be removed.</remarks>
        public class SwaggerDefaultValues : IOperationFilter
        {
            /// <summary>
            /// Applies the filter to the specified operation using the given context.
            /// </summary>
            /// <param name="operation">The operation to apply the filter to.</param>
            /// <param name="context">The current operation filter context.</param>
            public void Apply(Operation operation, OperationFilterContext context)
            {
                if (operation.Parameters == null)
                {
                    return;
                }

                // REF: https://github.com/domaindrivendev/Swashbuckle.AspNetCore/issues/412
                // REF: https://github.com/domaindrivendev/Swashbuckle.AspNetCore/pull/413
                foreach (var parameter in operation.Parameters.OfType<NonBodyParameter>())
                {
                    try
                    {
                        var description = context.ApiDescription.ParameterDescriptions.First(p => p.Name == parameter.Name);
                        var routeInfo = description.RouteInfo;

                        if (parameter.Description == null)
                        {
                            parameter.Description = description.ModelMetadata?.Description;
                        }

                        if (routeInfo == null)
                        {
                            continue;
                        }

                        if (parameter.Default == null)
                        {
                            parameter.Default = routeInfo.DefaultValue;
                        }

                        parameter.Required |= !routeInfo.IsOptional;
                    }
                    catch (Exception)
                    {
                        continue;
                    }
                }
            }
        }
    }

    /// <summary>
    /// https://github.com/MarkPieszak/aspnetcore-angular2-universal/issues/656#issuecomment-397927589
    /// </summary>
    public class ApiExplorerIgnores : IActionModelConvention
    {
        public void Apply(ActionModel action)
        {
            if (action.Controller.ControllerName.Equals("Pwa"))
            {
                action.ApiExplorer.IsVisible = false;
            }
        }
    }
}
