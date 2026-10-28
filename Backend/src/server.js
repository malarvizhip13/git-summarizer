const app = require("./app");
const env = require("./config/env");
const { query, closeDatabase } = require("./config/database");

let server;

const startServer = async () => {
  try {
    await query("SELECT 1");

    server = app.listen(env.PORT, () => {
      console.log(
        `GitSummarizer API running on http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (!server) {
    await closeDatabase();
    process.exit(0);
  }

  server.close(async () => {
    try {
      await closeDatabase();

      console.log("Database connection closed.");
      console.log("Server shut down successfully.");

      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

startServer();