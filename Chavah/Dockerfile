FROM microsoft/dotnet:2.2-aspnetcore-runtime AS base
WORKDIR /app
EXPOSE 5600
EXPOSE 44363

FROM microsoft/dotnet:2.2-sdk AS build
WORKDIR /src
COPY Chavah.NetCore/Chavah.NetCore.csproj Chavah.NetCore/
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
