const { pool } = require("../config/database");

/**
 * Create a repository or update its metadata if it already exists.
 *
 * Uses the unique constraint:
 * (user_id, github_owner, github_name)
 */
async function upsertRepository(repositoryData) {
  const {
    userId,
    githubUrl,
    githubOwner,
    githubName,
    defaultBranch,
  } = repositoryData;

  const sql = `
    INSERT INTO repositories (
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch
    )
    VALUES ($1, $2, $3, $4, $5)

    ON CONFLICT (user_id, github_owner, github_name)
    DO UPDATE SET
      github_url = EXCLUDED.github_url,
      default_branch = EXCLUDED.default_branch,
      updated_at = CURRENT_TIMESTAMP

    RETURNING
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      created_at,
      updated_at,
      (xmax = 0) AS created;
  `;

  const values = [
    userId,
    githubUrl,
    githubOwner,
    githubName,
    defaultBranch,
  ];

  const result = await pool.query(sql, values);

  return result.rows[0];
}

/**
 * Retrieve all repositories belonging to a user.
 */
async function findRepositoriesByUserId(userId) {
  const sql = `
    SELECT
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      created_at,
      updated_at
    FROM repositories
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(sql, [userId]);

  return result.rows;
}

/**
 * Retrieve one repository belonging to a specific user.
 */
async function findRepositoryByIdAndUserId(repositoryId, userId) {
  const sql = `
    SELECT
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      created_at,
      updated_at
    FROM repositories
    WHERE id = $1
      AND user_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(sql, [
    repositoryId,
    userId,
  ]);

  return result.rows[0] || null;
}

module.exports = {
  upsertRepository,
  findRepositoriesByUserId,
  findRepositoryByIdAndUserId,
};