# Dockerfile para el servicio de autenticación (.NET)
# Colocar en: Los_RR_Sistema_Bancario/auth-svc/auth/Dockerfile
# Root Directory en Render: Los_RR_Sistema_Bancario/auth-svc/auth

# ---- Etapa 1: build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar primero los archivos de proyecto para aprovechar el cache de capas de Docker
COPY global.json ./
COPY AuthService.sln ./
COPY src/Api/AuthService.Api.csproj src/Api/
COPY src/Application/AuthService.Application.csproj src/Application/
COPY src/Domain/AuthService.Domain.csproj src/Domain/
COPY src/Persistence/AuthService.Persistence.csproj src/Persistence/

RUN dotnet restore src/Api/AuthService.Api.csproj

# Copiar el resto del código y publicar
COPY . .
RUN dotnet publish src/Api/AuthService.Api.csproj -c Release -o /app/publish --no-restore

# ---- Etapa 2: runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Render inyecta la variable PORT en tiempo de ejecución; Program.cs ya la lee
# (Environment.GetEnvironmentVariable("PORT")) y configura UseUrls con ella.
ENTRYPOINT ["dotnet", "AuthService.Api.dll"]
