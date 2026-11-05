const { pool } = require("../config/database");

async function ensurePublicUser(userId) {
  await pool.query(
    `INSERT INTO users (id, email, name)
     VALUES ($1, 'public@gitsummarizer.local', 'Public')
     ON CONFLICT (id) DO NOTHING;`,
    [userId]
  );
}

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
    isSaved = true,
  } = repositoryData;

  const sql = `
    INSERT INTO repositories (
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      is_saved
    )
    VALUES ($1, $2, $3, $4, $5, $6)

    ON CONFLICT (user_id, github_owner, github_name)
    DO UPDATE SET
      github_url = EXCLUDED.github_url,
      default_branch = EXCLUDED.default_branch,
      is_saved = repositories.is_saved OR EXCLUDED.is_saved,
      updated_at = CURRENT_TIMESTAMP

    RETURNING
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      is_saved,
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
    isSaved,
  ];

  const result = await pool.query(sql, values);

  return result.rows[0];
}

/**
 * Retrieve saved repositories and repositories with analysis history.
 */
async function findPublicRepositories() {
  const sql = `
    SELECT
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      is_saved,
      created_at,
      updated_at
    FROM repositories
    WHERE is_saved = TRUE
      OR EXISTS (
        SELECT 1
        FROM analyses
        WHERE analyses.repository_id = repositories.id
      )
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(sql);

  return result.rows;
}

/**
 * Retrieve one repository by ID.
 */
async function findRepositoryById(repositoryId) {
  const sql = `
    SELECT
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      is_saved,
      created_at,
      updated_at
    FROM repositories
    WHERE id = $1
    LIMIT 1;
  `;

  const result = await pool.query(sql, [repositoryId]);

  return result.rows[0] || null;
}

async function markRepositoryAsSaved(repositoryId) {
  const sql = `
    UPDATE repositories
    SET
      is_saved = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id,
      user_id,
      github_url,
      github_owner,
      github_name,
      default_branch,
      is_saved,
      created_at,
      updated_at;
  `;

  const result = await pool.query(sql, [repositoryId]);

  return result.rows[0] || null;
}

module.exports = {
  ensurePublicUser,
  upsertRepository,
  findPublicRepositories,
  findRepositoryById,
  markRepositoryAsSaved,
};