const crypto = require("node:crypto");

const authRepository = require("../repositories/authRepository");

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createSession = async (userId) => {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await authRepository.createSession({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
  });

  return { token, expiresAt };
};

const getSessionUser = async (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  return authRepository.findSessionByTokenHash(hashToken(token));
};

const revokeSession = async (token) => {
  if (token && typeof token === "string") {
    await authRepository.deleteSession(hashToken(token));
  }
};

module.exports = {
  createSession,
  getSessionUser,
  revokeSession,
};
