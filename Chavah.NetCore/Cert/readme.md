#  ASP.NET Core with https self signed certificates and Kestrel

1. Windows box: makecert and pvk2pfx installed in possible paths

```
C:\Program Files (x86)\Windows Kits\10\bin\x64

C:\Program Files (x86)\Windows Kits\10\bin\10.0.16299.0\x64

```

2. Use makecert to create .pfx file, create password and use it in the next step:

```
makecert -sv c:\Cert\testCert.pvk -n "CN=BitShuva.Chavah" c:\Cert\testCert.cer -r
```

3. Convert to .pfx format with pvk2pkx:

```
pvk2pfx -pvk c:\Cert\testCert.pvk -spc c:\Cert\testCert.cer -pfx c:\Cert\testCert.pfx -pi Chavah2018
```

## Resources
[Introduction to Kestrel web server implementation in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel?tabs=aspnetcore2x)
[Develop-locally-with-https-self-signed-certificates-and-asp-net-core](https://www.humankode.com/asp-net-core/develop-locally-with-https-self-signed-certificates-and-asp-net-core)
[Testing-SSL-in-ASP-NET-Core](https://wildermuth.com/2016/10/26/Testing-SSL-in-ASP-NET-Core)
