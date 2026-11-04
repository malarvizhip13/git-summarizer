const path = require("node:path");

const { runner } = require("node-pg-migrate");
const env = require("../src/config/env");

const direction = process.argv[2];

if (direction !== "up" && direction !== "down") {
  console.error("Migration direction must be 'up' or 'down'.");
  process.exitCode = 1;
} else {
  runner({
    direction,
    count: direction === "down" ? 1 : undefined,
    dir: path.resolve(__dirname, "../migrations"),
    migrationsTable: "pgmigrations",
    schema: "public",
    databaseUrl: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_MIGRATION_USER || env.DB_USER,
      password: env.DB_MIGRATION_PASSWORD || env.DB_PASSWORD,
    },
    dryRun: process.argv.includes("--dry-run"),
  })
    .then((results) => {
      const completed = results.map((result) => result.name);
      console.log(
        completed.length
          ? `Migrations ${direction}: ${completed.join(", ")}`
          : "No pending migrations."
      );
    })
    .catch((error) => {
      console.error("Database migration failed:", error.message);
      process.exitCode = 1;
    });
}
