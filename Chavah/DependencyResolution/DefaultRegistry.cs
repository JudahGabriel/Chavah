#region copyright
// --------------------------------------------------------------------------------------------------------------------
// <copyright file="DefaultRegistry.cs" company="Web Advanced">
// Copyright 2012 Web Advanced (www.webadvanced.com)
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// </copyright>
// --------------------------------------------------------------------------------------------------------------------
#endregion

namespace BitShuva.DependencyResolution
{
    using System;
    using Models;
    using Raven.Client;
    using Raven.Client.Document;
    using Raven.Client.Indexes;
    using RavenDB.AspNet.Identity;
    using StructureMap;
    using StructureMap.Configuration.DSL;
    using StructureMap.Graph;
    using StructureMap.Web;
    using Microsoft.Owin.Security;
    using System.Web;
    using Interfaces;
    using Services;

    public class DefaultRegistry : Registry {
        #region Constructors and Destructors

        public DefaultRegistry() {
            Scan(
                scan => {
                    scan.TheCallingAssembly();
                    scan.WithDefaultConventions();
                });
            //For<IExample>().Use<Example>();

            For<ILoggerService>().Use<LoggerService>();

            #region RavebDb registry
            For<IDocumentStore>().Singleton().Use(ConfigureDocumentStore());
            For<IDocumentSession>().Singleton().Use(ctx => ctx.GetInstance<IDocumentStore>().OpenSession());
            For<IAsyncDocumentSession>().HttpContextScoped()
                .Use(ctx => ctx.GetInstance<IDocumentStore>().OpenAsyncSession());

            #endregion

            #region Identity registry

            For<UserStore<ApplicationUser>>().Use(ctx=> ConfigureUserStore(ctx));
            For<IAuthenticationManager>().Use(() => HttpContext.Current.GetOwinContext().Authentication);

            #endregion
        }

        static UserStore<ApplicationUser> ConfigureUserStore(IContext arg)
        {
            var store = new UserStore<ApplicationUser>(arg.GetInstance<IAsyncDocumentSession>());
            return store;
        }

        #endregion

        static IDocumentStore ConfigureDocumentStore()
        {
            var docStore = new DocumentStore { ConnectionStringName = "RavenDB" };
            docStore.Initialize();
           
            IndexCreation.CreateIndexes(typeof(RavenContext).Assembly, docStore);
            return docStore;
        }
    }
}