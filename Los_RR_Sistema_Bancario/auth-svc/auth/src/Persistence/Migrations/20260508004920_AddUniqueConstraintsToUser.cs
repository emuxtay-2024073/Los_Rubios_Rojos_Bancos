using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Primero, limpiar valores NULL o vacíos en Dpi que impiden el índice único
            // Generar valores únicos para DPIs nulos (usando timestamp + guid para garantizar unicidad)
            migrationBuilder.Sql(
                @"UPDATE ""User"" SET ""Dpi"" = TO_CHAR(NOW(), 'YYYYMMDDHHmmss') || '-' || gen_random_uuid()::text 
                  WHERE ""Dpi"" IS NULL OR ""Dpi"" = ''");

            migrationBuilder.AddColumn<string>(
                name: "DisabilityReason",
                table: "User",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DisableRequestReason",
                table: "User",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DisableRequestedAt",
                table: "User",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DisabledAt",
                table: "User",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasDisableRequest",
                table: "User",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDisabled",
                table: "User",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Crear índices únicos con filtro para permitir múltiples NULLs (en PostgreSQL)
            // Nota: PostgreSQL permite múltiples NULL en índices UNIQUE POR DEFECTO
            // Si necesitas realmente un único NULL, usa: WHERE "Dpi" IS NOT NULL
            migrationBuilder.CreateIndex(
                name: "IX_User_Dpi",
                table: "User",
                column: "Dpi",
                unique: true)
                .Annotation("Npgsql:IndexMethod", "btree")
                .Annotation("Npgsql:Where", "\"Dpi\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_User_Email",
                table: "User",
                column: "Email",
                unique: true)
                .Annotation("Npgsql:IndexMethod", "btree")
                .Annotation("Npgsql:Where", "\"Email\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_User_Username",
                table: "User",
                column: "Username",
                unique: true)
                .Annotation("Npgsql:IndexMethod", "btree")
                .Annotation("Npgsql:Where", "\"Username\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_User_Dpi",
                table: "User");

            migrationBuilder.DropIndex(
                name: "IX_User_Email",
                table: "User");

            migrationBuilder.DropIndex(
                name: "IX_User_Username",
                table: "User");

            migrationBuilder.DropColumn(
                name: "DisabilityReason",
                table: "User");

            migrationBuilder.DropColumn(
                name: "DisableRequestReason",
                table: "User");

            migrationBuilder.DropColumn(
                name: "DisableRequestedAt",
                table: "User");

            migrationBuilder.DropColumn(
                name: "DisabledAt",
                table: "User");

            migrationBuilder.DropColumn(
                name: "HasDisableRequest",
                table: "User");

            migrationBuilder.DropColumn(
                name: "IsDisabled",
                table: "User");
        }
    }
}
