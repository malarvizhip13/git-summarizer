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
      is_saved,
      created_at,
      updated_at
    FROM repositories
    WHERE user_id = $1
      AND is_saved = TRUE
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
      is_saved,
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

async function markRepositoryAsSaved(repositoryId, userId) {
  const sql = `
    UPDATE repositories
    SET
      is_saved = TRUE,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND user_id = $2
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

  const result = await pool.query(sql, [repositoryId, userId]);

  return result.rows[0] || null;
}

async function saveAnalysisForUser(analysisId, userId, guestUserId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sourceResult = await client.query(
      `SELECT
         r.github_url,
         r.github_owner,
         r.github_name,
         r.default_branch
       FROM analyses a
       INNER JOIN repositories r ON r.id = a.repository_id
       WHERE a.id = $1
         AND a.status = 'completed'
         AND r.user_id = $2
       LIMIT 1;`,
      [analysisId, guestUserId]
    );

    const sourceRepository = sourceResult.rows[0];
    if (!sourceRepository) {
      const error = new Error(
        "Completed guest analysis was not found."
      );
      error.statusCode = 404;
      throw error;
    }

    const repositoryResult = await client.query(
      `INSERT INTO repositories (
         user_id,
         github_url,
         github_owner,
         github_name,
         default_branch,
         is_saved
       )
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (user_id, github_owner, github_name)
       DO UPDATE SET
         github_url = EXCLUDED.github_url,
         default_branch = EXCLUDED.default_branch,
         is_saved = TRUE,
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
         updated_at;`,
      [
        userId,
        sourceRepository.github_url,
        sourceRepository.github_owner,
        sourceRepository.github_name,
        sourceRepository.default_branch,
      ]
    );
    const repository = repositoryResult.rows[0];

    const analysisResult = await client.query(
      `INSERT INTO analyses (
         repository_id,
         status,
         commit_sha,
         summary,
         analysis_result,
         error_message,
         started_at,
         completed_at,
         source_analysis_id
       )
       SELECT
         $2,
         a.status,
         a.commit_sha,
         a.summary,
         a.analysis_result,
         a.error_message,
         a.started_at,
         a.completed_at,
         a.id
       FROM analyses a
       INNER JOIN repositories source ON source.id = a.repository_id
       WHERE a.id = $1
         AND a.status = 'completed'
         AND source.user_id = $3
       ON CONFLICT (source_analysis_id, repository_id) DO NOTHING
       RETURNING id;`,
      [analysisId, repository.id, guestUserId]
    );
    let savedAnalysis = analysisResult.rows[0];

    if (!savedAnalysis) {
      const existingAnalysisResult = await client.query(
        `SELECT id
         FROM analyses
         WHERE source_analysis_id = $1
           AND repository_id = $2
         LIMIT 1;`,
        [analysisId, repository.id]
      );
      savedAnalysis = existingAnalysisResult.rows[0];
    }

    if (!savedAnalysis) {
      throw new Error("Analysis could not be saved to your account.");
    }

    await client.query("COMMIT");
    return {
      repository,
      analysisId: savedAnalysis.id,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  upsertRepository,
  findRepositoriesByUserId,
  findRepositoryByIdAndUserId,
  markRepositoryAsSaved,
  saveAnalysisForUser,
};