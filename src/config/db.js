const dns = require("dns");
const mongoose = require("mongoose");

const configureDns = () => {
  const dnsServers = process.env.DNS_SERVERS || "1.1.1.1,8.8.8.8";
  const servers = dnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MongoDB connection failed");
    console.error("MONGODB_URI is missing from your .env file.");
    process.exit(1);
  }

  try {
    if (mongoUri.startsWith("mongodb+srv://")) {
      configureDns();
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error(error.message);

    if (
      mongoUri.startsWith("mongodb+srv://") &&
      ["ECONNREFUSED", "ETIMEOUT", "ESERVFAIL", "ENOTFOUND"].includes(error.code)
    ) {
      console.error(
        "Your DNS resolver could not complete the MongoDB Atlas SRV lookup. Try DNS_SERVERS=1.1.1.1,8.8.8.8 in .env, switch Windows DNS to 1.1.1.1 or 8.8.8.8, disable VPN/proxy filtering, or use the non-SRV Atlas connection string."
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
