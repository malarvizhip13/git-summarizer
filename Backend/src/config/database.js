const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  ...(env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
      }),
  ssl: env.DB_SSL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

const query = (text, params) => {
  return pool.query(text, params);
};

const closeDatabase = async () => {
  await pool.end();
};

module.exports = {
  pool,
  query,
  closeDatabase,
};