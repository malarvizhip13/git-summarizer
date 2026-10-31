const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const apiRoutes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/v1/health", async (req, res) => {
  // existing health-check implementation
});

app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;