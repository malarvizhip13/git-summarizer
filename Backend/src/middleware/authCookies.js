const env = require("../config/env");

const isSecure = env.NODE_ENV === "production";

const cookieOptions = (maxAge, sameSite = "Lax") =>
  `Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${
    isSecure ? "; Secure" : ""
  }`;

const readCookie = (req, name) => {
  const cookieHeader = req.headers.cookie || "";

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;

    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return null;
};

const setSessionCookie = (res, token, maxAge) => {
  res.append(
    "Set-Cookie",
    `gs_session=${encodeURIComponent(token)}; ${cookieOptions(
      maxAge,
      isSecure ? "None" : "Lax"
    )}`
  );
};

const clearCookie = (res, name, path = "/") => {
  res.append(
    "Set-Cookie",
    `${name}=; ${cookieOptions(0).replace("Path=/", `Path=${path}`)}`
  );
};

module.exports = {
  readCookie,
  setSessionCookie,
  clearCookie,
};
