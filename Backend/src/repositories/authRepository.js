const { pool } = require("../config/database");

const findOrCreateGoogleUser = async ({
  googleId,
  name,
  email,
  avatarUrl,
}) => {
  const sql = `
    INSERT INTO users (
      oauth_provider,
      oauth_subject,
      name,
      email,
      avatar_url
    )
    VALUES ('google', $1, $2, $3, $4)
    ON CONFLICT (email)
    DO UPDATE SET
      oauth_provider = EXCLUDED.oauth_provider,
      oauth_subject = EXCLUDED.oauth_subject,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = CURRENT_TIMESTAMP
    WHERE users.oauth_subject IS NULL
      OR (
        users.oauth_provider = EXCLUDED.oauth_provider
        AND users.oauth_subject = EXCLUDED.oauth_subject
      )
    RETURNING id, email, name, oauth_provider, provider_name, avatar_url;
  `;

  const result = await pool.query(sql, [
    googleId,
    name,
    email,
    avatarUrl,
  ]);

  if (!result.rows[0]) {
    const error = new Error(
      "This email is already connected to a different sign-in account."
    );
    error.code = "OAUTH_ACCOUNT_CONFLICT";
    throw error;
  }

  return result.rows[0];
};

const createSession = async ({ tokenHash, userId, expiresAt }) => {
  await pool.query(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3);`,
    [tokenHash, userId, expiresAt]
  );
};

const findSessionByTokenHash = async (tokenHash) => {
  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.name,
       u.oauth_provider,
       u.provider_name,
       u.avatar_url,
       s.expires_at
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > CURRENT_TIMESTAMP
     LIMIT 1;`,
    [tokenHash]
  );

  return result.rows[0] || null;
};

const deleteSession = async (tokenHash) => {
  await pool.query(
    "DELETE FROM auth_sessions WHERE token_hash = $1;",
    [tokenHash]
  );
};

module.exports = {
  findOrCreateGoogleUser,
  createSession,
  findSessionByTokenHash,
  deleteSession,
};
