
const { pool } = require("../config/database");

/**
 * Create a new analysis record.
 * The analysis starts in the running state.
 */
const createAnalysis = async (repositoryId) => {
  const sql = `
    INSERT INTO analyses (
      repository_id,
      status,
      started_at
    )
    VALUES ($1, 'running', CURRENT_TIMESTAMP)
    RETURNING
      id,
      repository_id,
      status,
      started_at,
      created_at;
  `;

  const result = await pool.query(sql, [repositoryId]);

  return result.rows[0];
};

/**
 * Mark an analysis as completed and persist its result.
 */
const completeAnalysis = async ({
  analysisId,
  commitSha,
  analysisResult,
}) => {
  const sql = `
    UPDATE analyses
    SET
      status = 'completed',
      commit_sha = $2,
      analysis_result = $3::jsonb,
      error_message = NULL,
      completed_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'running'
    RETURNING
      id,
      repository_id,
      status,
      commit_sha,
      analysis_result,
      started_at,
      completed_at,
      created_at;
  `;

  const values = [
    analysisId,
    commitSha,
    JSON.stringify(analysisResult),
  ];

  const result = await pool.query(sql, values);

  return result.rows[0] || null;
};

/**
 * Mark an analysis as failed.
 */
const failAnalysis = async ({
  analysisId,
  errorMessage,
}) => {
  const sql = `
    UPDATE analyses
    SET
      status = 'failed',
      error_message = $2,
      completed_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'running'
    RETURNING
      id,
      repository_id,
      status,
      error_message,
      started_at,
      completed_at,
      created_at;
  `;

  const result = await pool.query(sql, [
    analysisId,
    errorMessage,
  ]);

  return result.rows[0] || null;
};
const findAnalysesByRepositoryAndUser = async (
  repositoryId,
  userId
) => {
  const sql = `
    SELECT
      a.id,
      a.repository_id,
      a.status,
      a.commit_sha,
      a.summary,
      a.error_message,
      a.started_at,
      a.completed_at,
      a.created_at
    FROM analyses a
    INNER JOIN repositories r
      ON r.id = a.repository_id
    WHERE a.repository_id = $1
      AND r.user_id = $2
    ORDER BY a.created_at DESC;
  `;

  const result = await pool.query(sql, [
    repositoryId,
    userId,
  ]);

  return result.rows;
};

/**
 * Retrieve one analysis belonging to a user.
 */
const findAnalysisByIdAndUser = async (
  analysisId,
  userId
) => {
  const sql = `
    SELECT
      a.id,
      a.repository_id,
      a.status,
      a.commit_sha,
      a.summary,
      a.analysis_result,
      a.error_message,
      a.started_at,
      a.completed_at,
      a.created_at
    FROM analyses a
    INNER JOIN repositories r
      ON r.id = a.repository_id
    WHERE a.id = $1
      AND r.user_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(sql, [
    analysisId,
    userId,
  ]);

  return result.rows[0] || null;
};
module.exports = {
  createAnalysis,
  completeAnalysis,
  failAnalysis,
  findAnalysesByRepositoryAndUser,
  findAnalysisByIdAndUser,
};

/**
 * Retrieve analysis history for a repository owned by a user.
 */
