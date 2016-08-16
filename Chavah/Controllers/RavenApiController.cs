using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;

namespace BitShuva.Controllers
{
    public abstract class RavenApiController : ApiController
    {
        public IAsyncDocumentSession Session { get; private set; } 

        public async override Task<HttpResponseMessage> ExecuteAsync(
            HttpControllerContext controllerContext,
            CancellationToken cancellationToken)
        {
            using (Session = RavenContext.Db.OpenAsyncSession())
            {
                var result = await base.ExecuteAsync(controllerContext, cancellationToken);
                await Session.SaveChangesAsync();

                return result;
            }
        }
    }
}
