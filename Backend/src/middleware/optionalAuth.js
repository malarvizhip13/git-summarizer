const { readCookie } = require("./authCookies");
const { getSessionUser } = require("../services/authService");

const optionalAuth = async (req, res, next) => {
  try {
    req.user = await getSessionUser(readCookie(req, "gs_session"));
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = optionalAuth;
