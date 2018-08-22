# Docker Container Help

## Resources
- [Using .NET and Docker Together](https://blogs.msdn.microsoft.com/dotnet/2018/06/13/using-net-and-docker-together-dockercon-2018-update/?mkt_tok=eyJpIjoiTnpGa1lqVTNZMkl3TlRWaCIsInQiOiJsaEpab3VUdVBMMVNWVkxNb3VRSVl5SFpmT3hlS3cwaWFmQ3p2c1FCODBoMVwvdkhoTkNsV1B1UVVaazI2VzhLbzNKYjdJdkNpMWphMThLbVlLWTlXKzl3VFVUck9LOVwvWlJMSTJjZEhUMCtuRm1mekVxdERidFdpd3Y4T0hMMVlQIn0%3D)
- [Hosting ASP.NET Core Images with Docker over HTTPS](https://github.com/dotnet/dotnet-docker/blob/master/samples/aspnetapp/aspnetcore-docker-https.md)
- [Running .NET Core Unit Tests with Docker](https://github.com/dotnet/dotnet-docker/blob/master/samples/dotnetapp/dotnet-docker-unit-testing.md)

```


dotnet dev-certs https -ep C:\Users\{USER_NAME}\AppData\Roaming\ASP.NET\Https\Chavah.NetCore.pfx -p 180e7ef9-d46a-4bed-a940-8717061b2b6f


%APPDATA%\Microsoft\UserSecrets
%APPDATA%\ASP.NET

Manage Secreate to update to
    "Kestrel:Certificates:Development:Password": "180e7ef9-d46a-4bed-a940-8717061b2b6f",
    "Kestrel": {
        "Certificates": {
            "Default": {
                "Path": "/root/.aspnet/https/Chavah.NetCore.pfx",
                "Password": "180e7ef9-d46a-4bed-a940-8717061b2b6f"
            }
        }
    }
```