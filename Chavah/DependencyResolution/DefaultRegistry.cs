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

using System;
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
using BitShuva.Interfaces;
using BitShuva.Services;
using Microsoft.AspNet.Identity.Owin;
using BitShuva.Models;

namespace BitShuva.DependencyResolution
{
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

            // JGH I commented this out: we should have only 1 DocumentStore per app. We already initialize one in RavenContext. We either need to intialize it here, or in RavenContext, but not both.
            //For<IDocumentStore>().Singleton().Use(ConfigureDocumentStore());

            // JGH Commented out: DocumentSessions are intended to be short-lived. Do we really want a singleton here?
            // Also, do we really want a IDocumentSession? We should default to IAsyncDocumentSession.
            //For<IDocumentSession>().Singleton().Use(ctx => ctx.GetInstance<IDocumentStore>().OpenSession());

            // JGH Were is .SaveChanges being called? 
            For<IAsyncDocumentSession>().HttpContextScoped()
                .Use(ctx => HttpContext.Current.GetOwinContext().Get<IAsyncDocumentSession>());

            For<ApplicationUserManager>().Use(ctx => HttpContext.Current.GetOwinContext().Get<ApplicationUserManager>());
            For<UserStore<ApplicationUser>>().Use(ctx => ConfigureUserStore(ctx));
            For<IAuthenticationManager>().Use(() => HttpContext.Current.GetOwinContext().Authentication);
        }

        static UserStore<ApplicationUser> ConfigureUserStore(IContext arg)
        {
            // JGH: This doesn't work. The UserStore will throw an exception when generating a password reset token because its owning ApplicationUserManager isn't configured right. See ApplicationUser.Create to see how to configure it properly. 
            // Found this was broken the hard way: user complained Chavah wasn't working when he tried to reset his password.
            // I've changed the calling code to use the existing ApplicationUserManager.

            //var store =  new UserStore<ApplicationUser>(arg.GetInstance<IAsyncDocumentSession>());
            //return store;

            return ApplicationUserManager.UserStore;
        }

        #endregion

        //static IDocumentStore ConfigureDocumentStore()
        //{
        //    var docStore = new DocumentStore { ConnectionStringName = "RavenDB" };
        //    docStore.Initialize();

        //    IndexCreation.CreateIndexes(typeof(RavenContext).Assembly, docStore);
        //    return docStore;
        //}
    }
}