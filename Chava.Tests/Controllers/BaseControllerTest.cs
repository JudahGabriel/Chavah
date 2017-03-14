using Rhino.Mocks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Chava.Tests.Controllers
{
    public class BaseControllerTest
    {
        public HttpContextBase Context { get; private set; }
        public HttpRequestBase Request { get; private set; }

        public BaseControllerTest()
        {
            Context = MockRepository.GenerateMock<HttpContextBase>();

            Request = MockRepository.GenerateMock<HttpRequestBase>();

            Request.Stub(x => x.IsAuthenticated).Return(true);
            Context.Stub(x => x.Request).Return(Request);
   
        }

        protected HttpContextBase HttpContextStub(bool isAjaxRequest)
        {
            var httpRequestBase = MockRepository.GenerateStub<HttpRequestBase>();
            if (isAjaxRequest)
            {
                httpRequestBase.Stub(r => r["X-Requested-With"]).Return("XMLHttpRequest");
            }

            var httpContextBase = MockRepository.GenerateStub<HttpContextBase>();
            httpContextBase.Stub(c => c.Request).Return(httpRequestBase);

            return httpContextBase;
        }


    }
}
