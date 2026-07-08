using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeDpiNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the existing unique index on Dpi
            migrationBuilder.DropIndex(
                name: "IX_User_Dpi",
                table: "User");

            // Alter the PhoneNumber column to be nullable
            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "User",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            // Alter the Dpi column to be nullable
            migrationBuilder.AlterColumn<string>(
                name: "Dpi",
                table: "User",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            // Recreate the unique index with a filter for non-null values
            migrationBuilder.CreateIndex(
                name: "IX_User_Dpi",
                table: "User",
                column: "Dpi",
                unique: true,
                filter: "Dpi IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the filtered unique index
            migrationBuilder.DropIndex(
                name: "IX_User_Dpi",
                table: "User");

            // Revert the PhoneNumber column to be non-nullable
            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "User",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // Revert the Dpi column to be non-nullable
            migrationBuilder.AlterColumn<string>(
                name: "Dpi",
                table: "User",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // Recreate the simple unique index
            migrationBuilder.CreateIndex(
                name: "IX_User_Dpi",
                table: "User",
                column: "Dpi",
                unique: true);
        }
    }
}
