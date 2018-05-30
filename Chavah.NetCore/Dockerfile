FROM microsoft/aspnetcore:2.0 AS base
WORKDIR /app
EXPOSE 44363
EXPOSE 44363

FROM microsoft/aspnetcore-build:2.0 AS build
WORKDIR /src
COPY Chavah.NetCore/Chavah.NetCore.csproj Chavah.NetCore/
COPY D:\Dev\GitHub\Chavah\Chavah.NetCore\nuget.config Chavah.NetCore/
RUN dotnet restore Chavah.NetCore/Chavah.NetCore.csproj
COPY . .
WORKDIR /src/Chavah.NetCore
RUN dotnet build Chavah.NetCore.csproj -c Release -o /app

FROM build AS publish
RUN dotnet publish Chavah.NetCore.csproj -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "BitShuva.Chavah.dll"]
