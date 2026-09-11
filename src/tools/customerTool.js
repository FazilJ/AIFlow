const Customer = require("../models/Customer");

const customerLookup = async ({
  email,
  phone,
  whatsappNumber,
}) => {
  try {
    if (!email && !phone && !whatsappNumber) {
      return {
        success: false,
        message:
          "Please provide email, phone, or WhatsApp number",
      };
    }

    const query = {
      $or: [],
    };

    if (email) {
      query.$or.push({
        email: email.toLowerCase().trim(),
      });
    }

    if (phone) {
      query.$or.push({
        phone: phone.trim(),
      });
    }

    if (whatsappNumber) {
      query.$or.push({
        whatsappNumber: whatsappNumber.trim(),
      });
    }

    const customer = await Customer.findOne(query)
      .populate("business", "name email phone");

    if (!customer) {
      return {
        success: false,
        found: false,
        message: "Customer not found",
      };
    }

    return {
      success: true,
      found: true,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        whatsappNumber:
          customer.whatsappNumber,
        source: customer.source,
        business: customer.business,
      },
    };
  } catch (error) {
    console.error(
      "Customer Lookup Tool Error:",
      error
    );

    throw new Error(
      "Failed to lookup customer"
    );
  }
};

module.exports = {
  customerLookup,
};