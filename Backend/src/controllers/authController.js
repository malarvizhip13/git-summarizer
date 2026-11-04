const crypto = require("node:crypto");

const env = require("../config/env");
const { clearCookie, readCookie, setSessionCookie } = require(
  "../middleware/authCookies"
);
const authRepository = require("../repositories/authRepository");
const {
  createSession,
  getSessionUser,
  revokeSession,
} = require("../services/authService");

const STATE_COOKIE = "gs_oauth_state";
const STATE_MAX_AGE_SECONDS = 600;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const frontendCallback = (error) => {
  const url = new URL("/auth/callback", env.FRONTEND_URL);
  if (error) url.searchParams.set("error", error);
  return url.toString();
};

const startGoogleOAuth = (req, res) => {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    console.error(
      "Google sign-in is not configured. Set the OAuth client ID and secret."
    );
    return res.redirect(302, frontendCallback("google_sign_in_not_configured"));
  }

  const state = crypto.randomBytes(32).toString("base64url");
  res.setHeader(
    "Set-Cookie",
    `${STATE_COOKIE}=${encodeURIComponent(state)}; Path=/api/v1/auth/google/callback; HttpOnly; SameSite=Lax; Max-Age=${STATE_MAX_AGE_SECONDS}${
      env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );
  authorizationUrl.searchParams.set(
    "client_id",
    env.GOOGLE_OAUTH_CLIENT_ID
  );
  authorizationUrl.searchParams.set(
    "redirect_uri",
    env.GOOGLE_OAUTH_CALLBACK_URL
  );
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("prompt", "select_account");
  authorizationUrl.searchParams.set("state", state);

  return res.redirect(302, authorizationUrl.toString());
};

const completeGoogleOAuth = async (req, res) => {
  const finishWithError = (error) => {
    clearCookie(res, STATE_COOKIE, "/api/v1/auth/google/callback");
    return res.redirect(302, frontendCallback(error));
  };

  if (req.query.error) {
    return finishWithError("google_authorization_denied");
  }

  const stateCookie = readCookie(req, STATE_COOKIE);
  const returnedState = req.query.state;
  const stateCookieBytes = Buffer.from(stateCookie || "");
  const returnedStateBytes = Buffer.from(
    typeof returnedState === "string" ? returnedState : ""
  );
  if (
    !stateCookie ||
    typeof returnedState !== "string" ||
    stateCookieBytes.length !== returnedStateBytes.length ||
    !crypto.timingSafeEqual(
      stateCookieBytes,
      returnedStateBytes
    )
  ) {
    return finishWithError("invalid_oauth_state");
  }

  if (typeof req.query.code !== "string") {
    return finishWithError("missing_authorization_code");
  }

  try {
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: env.GOOGLE_OAUTH_CLIENT_ID,
          client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
          code: req.query.code,
          grant_type: "authorization_code",
          redirect_uri: env.GOOGLE_OAUTH_CALLBACK_URL,
        }),
      }
    );
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google OAuth token exchange failed:", tokenData.error);
      return finishWithError("google_sign_in_failed");
    }

    const googleHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    };
    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: googleHeaders }
    );

    if (!profileResponse.ok) {
      console.error(
        "Google OAuth profile request failed:",
        profileResponse.status
      );
      return finishWithError("google_profile_unavailable");
    }

    const profile = await profileResponse.json();

    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      return finishWithError("verified_email_required");
    }

    const user = await authRepository.findOrCreateGoogleUser({
      googleId: profile.sub,
      name: profile.name || profile.email,
      email: profile.email,
      avatarUrl: profile.picture || null,
    });
    const session = await createSession(user.id);

    clearCookie(res, STATE_COOKIE, "/api/v1/auth/google/callback");
    setSessionCookie(res, session.token, SESSION_MAX_AGE_SECONDS);
    return res.redirect(302, frontendCallback());
  } catch (error) {
    console.error("Google OAuth callback failed:", error.message);
    if (
      error.code === "23505" ||
      error.code === "OAUTH_ACCOUNT_CONFLICT"
    ) {
      return finishWithError("google_account_conflict");
    }
    return finishWithError("google_sign_in_failed");
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getSessionUser(readCookie(req, "gs_session"));

    return res.status(200).json({
      success: true,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            provider: user.oauth_provider,
            avatarUrl: user.avatar_url,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await revokeSession(readCookie(req, "gs_session"));
    clearCookie(res, "gs_session");

    return res.status(200).json({
      success: true,
      message: "Signed out successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  startGoogleOAuth,
  completeGoogleOAuth,
  getCurrentUser,
  logout,
};
