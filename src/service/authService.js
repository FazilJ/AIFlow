const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const registerUser = async (userData) => {
const {
  name,
  email,
  password,
} = userData;

const role = "business_owner";
  // ==============================================
  // Basic validation
  // ==============================================
  if (!name || !name.trim()) {
    const error = new Error("Name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!email || !email.trim()) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("Password is required");
    error.statusCode = 400;
    throw error;
  }

  // ==============================================
  // Validate role
  // ==============================================

  const normalizedEmail =
    email.trim().toLowerCase();

  // ==============================================
  // Check existing user
  // ==============================================
  const existingUser =
    await User.findOne({
      email: normalizedEmail,
    });

  if (existingUser) {
    const error = new Error(
      "Email already registered"
    );

    error.statusCode = 409;
    throw error;
  }

  // ==============================================
  // Hash password
  // ==============================================
  const hashedPassword =
    await bcrypt.hash(password, 12);

  // ==============================================
  // Create user
  // ==============================================
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    businesses: [],
  });

  return user;
};

const createAdminUser = async (userData) => {
  const { name, email, password } = userData;

  if (!name || !name.trim()) {
    const error = new Error("Name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!email || !email.trim()) {
    const error = new Error("Email is required");
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("Password is required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "admin",
    businesses: [],
    isActive: true,
  });

  return user;
};

const loginUser = async (
  email,
  password
) => {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await User.findOne({
      email: normalizedEmail,
    });

  if (!user) {
    const error = new Error(
      "Invalid email or password"
    );

    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
  const error = new Error(
    "Your account has been deactivated. Please contact an administrator."
  );

  error.statusCode = 403;
  throw error;
}

  const passwordMatch =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!passwordMatch) {
    const error = new Error(
      "Invalid email or password"
    );

    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
  createAdminUser,
};