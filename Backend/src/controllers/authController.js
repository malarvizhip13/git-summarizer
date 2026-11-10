const bcrypt = require("bcryptjs");
const { query } = require("../config/database");
const jwt = require("jsonwebtoken");

// SIGN UP
const signup = async (req, res, next) => {
  try {
   const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// SIGN IN
const signin = async (req, res, next) => {
  try {
  const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

   const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d",
  }
);

return res.status(200).json({
  success: true,
  message: "Signin successful",
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
  },
});

  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  signin,
};