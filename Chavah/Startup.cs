using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(BitShuva.Startup))]

namespace BitShuva
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);

        }
    }
}