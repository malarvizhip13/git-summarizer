const { readCookie } = require("./authCookies");
const { getSessionUser } = require("../services/authService");

const requireAuth = async (req, res, next) => {
  try {
    const user = await getSessionUser(readCookie(req, "gs_session"));

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sign in with GitHub to access your account.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = requireAuth;
