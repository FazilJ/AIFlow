const bcrypt = require("bcryptjs");
const User = require("../models/User");

const getTeamMembers = async (businessId) => {
  const members = await User.find({
    businesses: businessId,
  })
    .select("_id name email role businesses createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return members.map((member) => ({
    id: member._id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: "active",
    businesses: member.businesses,
    createdAt: member.createdAt,
  }));
};

const createTeamMember = async ({
  name,
  email,
  password,
  role,
  businessId,
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    const alreadyAssigned = existingUser.businesses.some(
      (business) =>
        business.toString() === businessId.toString()
    );

    if (alreadyAssigned) {
      const error = new Error(
        "This user is already a member of this business"
      );

      error.statusCode = 409;
      throw error;
    }

    existingUser.businesses.push(businessId);

    await existingUser.save();

    return {
      id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      status: "active",
      businesses: existingUser.businesses,
      createdAt: existingUser.createdAt,
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role,
    businesses: [businessId],
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: "active",
    businesses: user.businesses,
    createdAt: user.createdAt,
  };
};


/*
 * Remove a user from the current business.
 * The user account itself is NOT deleted.
 */
const removeTeamMember = async ({
  memberId,
  businessId,
}) => {
  const member = await User.findById(memberId);

  if (!member) {
    const error = new Error("Team member not found");
    error.statusCode = 404;
    throw error;
  }

  const isMember = member.businesses.some(
    (business) =>
      business.toString() === businessId.toString()
  );

  if (!isMember) {
    const error = new Error(
      "User is not a member of this business"
    );

    error.statusCode = 404;
    throw error;
  }

  member.businesses = member.businesses.filter(
    (business) =>
      business.toString() !== businessId.toString()
  );

  await member.save();

  return {
    id: member._id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: "inactive",
    businesses: member.businesses,
    createdAt: member.createdAt,
  };
};


/*
 * Change team member role.
 */
const updateTeamMemberRole = async ({
  memberId,
  businessId,
  role,
}) => {
  const allowedRoles = [
    "business_owner",
    "support_agent",
  ];

  if (!allowedRoles.includes(role)) {
    const error = new Error(
      "Invalid role. Use business_owner or support_agent."
    );

    error.statusCode = 400;
    throw error;
  }

  const member = await User.findById(memberId);

  if (!member) {
    const error = new Error("Team member not found");
    error.statusCode = 404;
    throw error;
  }

  const isMember = member.businesses.some(
    (business) =>
      business.toString() === businessId.toString()
  );

  if (!isMember) {
    const error = new Error(
      "User is not a member of this business"
    );

    error.statusCode = 404;
    throw error;
  }

  member.role = role;

  await member.save();

  return {
    id: member._id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: "active",
    businesses: member.businesses,
    createdAt: member.createdAt,
  };
};


module.exports = {
  getTeamMembers,
  createTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
};